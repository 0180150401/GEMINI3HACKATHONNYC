'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
      const res = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 40.7128, lng: -74.006 }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
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
