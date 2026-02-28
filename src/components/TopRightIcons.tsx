'use client';

import { useState, useEffect } from 'react';

const icons = {
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  location: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
};

export function TopRightIcons() {
  const [musicConnected, setMusicConnected] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/connections')
      .then((r) => r.ok ? r.json() : null)
      .then((c) => c && setMusicConnected(c.spotify ?? false))
      .catch(() => {});
  }, []);

  const handleUpload = () => {
    // Placeholder: could open file input
  };

  const handleMusic = () => {
    if (musicConnected) return;
    window.location.href = '/api/auth/spotify';
  };

  const handleLocation = () => {
    if (locationEnabled) return;
    navigator.geolocation.getCurrentPosition(
      () => setLocationEnabled(true),
      () => {}
    );
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      <button
        onClick={handleUpload}
        className="p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Upload"
      >
        {icons.upload}
      </button>
      <button
        onClick={handleMusic}
        className={`p-2 transition-colors ${musicConnected ? 'text-white' : 'text-white/60 hover:text-white'}`}
        aria-label="Music"
      >
        {icons.music}
      </button>
      <button
        onClick={handleLocation}
        className={`p-2 transition-colors ${locationEnabled ? 'text-white' : 'text-white/60 hover:text-white'}`}
        aria-label="Location"
      >
        {icons.location}
      </button>
    </div>
  );
}
