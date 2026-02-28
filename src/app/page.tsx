'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STORAGE_IMAGE_KEY = 'recesss_upload_image';
const STORAGE_PLAYLIST_KEY = 'recesss_upload_playlist';

export default function HomePage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthReady(true);
      } else {
        supabase.auth.signInAnonymously().then(() => setAuthReady(true));
      }
    });
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      let lat = 40.7128;
      let lng = -74.006;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // use default NYC coords
      }
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      let uploadedPlaylist: { tracks: { name?: string; tempo?: number }[] } | undefined;
      try {
        const stored = sessionStorage.getItem(STORAGE_IMAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { base64?: string; mimeType?: string };
          imageBase64 = parsed.base64;
          imageMimeType = parsed.mimeType ?? 'image/jpeg';
        }
      } catch {
        // ignore
      }
      try {
        const stored = sessionStorage.getItem(STORAGE_PLAYLIST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { tracks?: { name?: string; tempo?: number }[] };
          if (parsed.tracks) uploadedPlaylist = { tracks: parsed.tracks };
        }
      } catch {
        // ignore
      }

      const res = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, imageBase64, imageMimeType, metrics: { uploadedPlaylist } }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      sessionStorage.removeItem(STORAGE_IMAGE_KEY);
      window.dispatchEvent(new Event('recesss-storage-update'));
      router.push(`/game/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-8">Recesss</h1>

      <button
        onClick={handleGenerate}
        disabled={!authReady || generating}
        className="text-sm font-bold uppercase underline hover:no-underline disabled:opacity-50"
      >
        {!authReady ? 'Loading...' : generating ? 'Generating...' : 'Go Fucking Play'}
      </button>
      {error && <p className="mt-4 text-xs text-white/60">{error}</p>}
    </div>
  );
}
