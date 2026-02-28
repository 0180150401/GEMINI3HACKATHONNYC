'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NewGameForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lat, setLat] = useState('40.7128');
  const [lng, setLng] = useState('-74.006');

  useEffect(() => {
    const urlLat = searchParams.get('lat');
    const urlLng = searchParams.get('lng');
    if (urlLat) setLat(urlLat);
    if (urlLng) setLng(urlLng);
  }, [searchParams]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(lat) || 40.7128,
          lng: parseFloat(lng) || -74.006,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate');
      router.push(`/game/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <a href="/" className="text-sm font-bold uppercase underline hover:no-underline">
          ← Recesss
        </a>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Generate Game</h1>
          <p className="text-white/70">
            Enter location for terrain data. Gemini analyzes your data and creates a personalized game.
          </p>
        </div>

        <div className="border-2 border-white p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-white/70">Latitude</label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="w-full border-2 border-white bg-black px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="40.7128"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-white/70">Longitude</label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="w-full border-2 border-white bg-black px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="-74.006"
            />
          </div>

          {error && (
            <p className="text-sm border-2 border-white p-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full border-2 border-white px-6 py-4 font-bold uppercase hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewGamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">...</div>}>
      <NewGameForm />
    </Suspense>
  );
}
