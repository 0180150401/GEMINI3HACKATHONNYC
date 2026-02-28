'use client';

import { useState } from 'react';

interface ConnectionCardsProps {
  userId?: string;
}

export function ConnectionCards({ userId }: ConnectionCardsProps) {
  const [manualData, setManualData] = useState({
    lat: '',
    lng: '',
    screenTimeHours: 0,
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    const res = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics: {
          landscape: {
            lat: manualData.lat ? parseFloat(manualData.lat) : undefined,
            lng: manualData.lng ? parseFloat(manualData.lng) : undefined,
          },
          digitalUsage: {
            screenTimeHours: manualData.screenTimeHours,
          },
        },
      }),
    });
    if (res.ok) {
      alert('Data saved! You can now generate a game.');
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Google Cloud */}
      <div className="border-2 border-white p-6">
        <h3 className="font-bold uppercase mb-2">Google Cloud</h3>
        <p className="text-sm text-white/70 mb-4">
          Elevation API & Places API for terrain data. Add GOOGLE_MAPS_API_KEY.
        </p>
        <a
          href="https://developers.google.com/maps/documentation/elevation"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold uppercase underline hover:no-underline"
        >
          Docs →
        </a>
      </div>

      {/* Spotify */}
      <div className="border-2 border-white p-6">
        <h3 className="font-bold uppercase mb-2">Spotify</h3>
        <p className="text-sm text-white/70 mb-4">
          Sync tempo and playback state.
        </p>
        <a
          href="/api/auth/spotify"
          className="inline-block border-2 border-white px-4 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
        >
          Connect
        </a>
      </div>

      {/* Open Topo Data */}
      <div className="border-2 border-white p-6">
        <h3 className="font-bold uppercase mb-2">Open Topo</h3>
        <p className="text-sm text-white/70 mb-4">
          Free elevation API fallback. Enter lat/lng in Generate Game.
        </p>
        <a
          href="https://www.opentopodata.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold uppercase underline hover:no-underline"
        >
          API →
        </a>
      </div>

      {/* Manual Input */}
      <div className="border-2 border-white p-6">
        <h3 className="font-bold uppercase mb-2">Manual Input</h3>
        <p className="text-sm text-white/70 mb-4">
          Location and screen time for demo.
        </p>
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <input
            type="text"
            placeholder="Latitude"
            value={manualData.lat}
            onChange={(e) => setManualData((d) => ({ ...d, lat: e.target.value }))}
            className="w-full border-2 border-white bg-black px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="text"
            placeholder="Longitude"
            value={manualData.lng}
            onChange={(e) => setManualData((d) => ({ ...d, lng: e.target.value }))}
            className="w-full border-2 border-white bg-black px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <input
            type="number"
            step="0.5"
            placeholder="Screen time (hrs)"
            value={manualData.screenTimeHours || ''}
            onChange={(e) => setManualData((d) => ({ ...d, screenTimeHours: +e.target.value }))}
            className="w-full border-2 border-white bg-black px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="w-full border-2 border-white px-4 py-2 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
