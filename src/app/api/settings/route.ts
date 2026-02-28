import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface ProfileSettings {
  displayName?: string;
  username?: string;
  locationEnabled?: boolean;
  fileAccessEnabled?: boolean;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: metricsData }, { data: profile }] = await Promise.all([
    supabase.from('user_metrics').select('metrics').eq('user_id', user.id).eq('provider', 'profile').single(),
    supabase.from('profiles').select('username, display_name').eq('user_id', user.id).single(),
  ]);

  const metrics = (metricsData?.metrics as ProfileSettings) ?? {};
  return NextResponse.json({
    displayName: profile?.display_name ?? metrics.displayName ?? '',
    username: profile?.username ?? '',
    locationEnabled: metrics.locationEnabled ?? false,
    fileAccessEnabled: metrics.fileAccessEnabled ?? false,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ProfileSettings>;
  const metrics: ProfileSettings = {
    displayName: body.displayName,
    locationEnabled: body.locationEnabled,
    fileAccessEnabled: body.fileAccessEnabled,
  };

  const { error } = await supabase
    .from('user_metrics')
    .upsert(
      {
        user_id: user.id,
        provider: 'profile',
        metrics: metrics as Record<string, unknown>,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.displayName !== undefined || body.username !== undefined) {
    const username = body.username?.trim().toLowerCase();
    if (username && !/^[a-z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only use letters, numbers, and underscores' }, { status: 400 });
    }
    const { data: existing } = await supabase.from('profiles').select('id, invite_code').eq('user_id', user.id).single();
    const now = new Date().toISOString();
    if (existing) {
      const updates: Record<string, unknown> = { updated_at: now };
      if (body.displayName !== undefined) updates.display_name = body.displayName;
      if (username !== undefined) updates.username = username;
      if (Object.keys(updates).length > 1) {
        await supabase.from('profiles').update(updates).eq('user_id', user.id);
      }
    } else if (username) {
      await supabase.from('profiles').insert({
        user_id: user.id,
        invite_code: username,
        username,
        display_name: body.displayName,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
