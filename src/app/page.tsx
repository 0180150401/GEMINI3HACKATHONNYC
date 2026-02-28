'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Countdown } from '@/components/Countdown';

export default function HomePage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDevGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: 40.7128, lng: -74.006 }),
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

      <Countdown />

      <button
        onClick={handleDevGenerate}
        disabled={generating}
        className="mt-8 text-xs font-bold uppercase border-2 border-white/50 px-4 py-2 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {generating ? 'Generating...' : 'Dev: Generate Game'}
      </button>
      {error && <p className="mt-2 text-xs text-white/60">{error}</p>}
    </div>
  );
}
