import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { GoogleGenAI, createPartFromBase64 } from '@google/genai';

const DEFAULT_LAT = 40.7128;
const DEFAULT_LNG = -74.006;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    task: string;
    verificationCriteria: string;
    imageBase64: string;
    imageMimeType?: string;
    lat?: number;
    lng?: number;
  };

  const { task, verificationCriteria, imageBase64, imageMimeType = 'image/jpeg', lat, lng } = body;
  if (!task || !verificationCriteria || !imageBase64) {
    return NextResponse.json(
      { error: 'Missing task, verificationCriteria, or imageBase64' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are verifying that a user completed a real-world task. The user was asked to: "${task}".

Verification criteria (what to look for in the photo): "${verificationCriteria}"

Look at the image and determine if the user successfully completed the task. Be reasonable: if the photo clearly shows the required action (or the required elements), respond with verified: true. If the photo is unclear, unrelated, or does not show the required elements, respond with verified: false.

Respond with ONLY a JSON object: { "verified": boolean, "message": "brief explanation" }`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        createPartFromBase64(imageBase64, imageMimeType),
        prompt,
      ],
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const text = res.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });
    }

    const result = JSON.parse(text) as { verified?: boolean; message?: string };
    const verified = result.verified === true;

    if (verified) {
      let photoUrl: string | null = null;
      try {
        const buffer = Buffer.from(imageBase64, 'base64');
        const ext = imageMimeType?.includes('png') ? 'png' : 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-photos')
          .upload(path, buffer, {
            contentType: imageMimeType || 'image/jpeg',
            upsert: false,
          });
        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('task-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      } catch {
        // Save without photo if upload fails
      }

      let resolvedLat = lat;
      let resolvedLng = lng;
      if (resolvedLat == null || resolvedLng == null) {
        const { data: metrics } = await supabase
          .from('user_metrics')
          .select('metrics')
          .eq('user_id', user.id)
          .eq('provider', 'manual')
          .maybeSingle();
        const landscape = (metrics?.metrics as { landscape?: { lat?: number; lng?: number } })?.landscape;
        if (landscape?.lat != null && landscape?.lng != null) {
          resolvedLat = landscape.lat;
          resolvedLng = landscape.lng;
        } else {
          resolvedLat = DEFAULT_LAT;
          resolvedLng = DEFAULT_LNG;
        }
      }

      await supabase.from('task_completions').insert({
        user_id: user.id,
        task,
        photo_url: photoUrl,
        lat: resolvedLat,
        lng: resolvedLng,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
