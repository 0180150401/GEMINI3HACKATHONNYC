'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SettingsContent() {
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [fileAccessEnabled, setFileAccessEnabled] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') {
      setSpotifyConnected(true);
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, connectionsRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/connections'),
        ]);
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          setDisplayName(s.displayName ?? '');
          setUsername(s.username ?? '');
          setLocationEnabled(s.locationEnabled ?? false);
          setFileAccessEnabled(s.fileAccessEnabled ?? false);
        }
        if (connectionsRes.ok) {
          const c = await connectionsRes.json();
          setSpotifyConnected(c.spotify ?? false);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          username,
          locationEnabled,
          fileAccessEnabled,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch {
      // show error
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = () => {
    const next = !locationEnabled;
    if (next) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationEnabled(true),
        () => {}
      );
    } else {
      setLocationEnabled(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-white/60">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-8">
        <a href="/" className="text-sm font-bold uppercase underline hover:no-underline">
          ← Recesss
        </a>

        <h1 className="text-3xl font-bold uppercase tracking-tight">Settings</h1>

        {/* User data */}
        <section className="border-2 border-white p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase text-white/70">User Data</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-white/60">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="username"
                className="w-full border-2 border-white bg-black px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <p className="text-xs text-white/50">Letters, numbers, underscores. Friends find you by this.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-white/60">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full border-2 border-white bg-black px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>
        </section>

        {/* Music */}
        <section className="border-2 border-white p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase text-white/70">Music</h2>
          <p className="text-sm text-white/60">
            Connect Spotify to personalize games with your current tempo and playback.
          </p>
          {spotifyConnected ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase">Connected</span>
              <span className="text-white/60">•</span>
              <a
                href="/api/auth/spotify?returnTo=/settings"
                className="text-xs uppercase underline hover:no-underline"
              >
                Reconnect
              </a>
            </div>
          ) : (
            <a
              href="/api/auth/spotify?returnTo=/settings"
              className="inline-block border-2 border-white px-6 py-3 text-sm font-bold uppercase hover:bg-white hover:text-black transition-colors"
            >
              Connect Spotify
            </a>
          )}
        </section>

        {/* Location */}
        <section className="border-2 border-white p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase text-white/70">Location</h2>
          <p className="text-sm text-white/60">
            Allow location access for terrain and weather data in your games.
          </p>
          <button
            onClick={toggleLocation}
            className={`w-full border-2 px-6 py-3 text-sm font-bold uppercase transition-colors ${
              locationEnabled ? 'border-white bg-white text-black' : 'border-white hover:bg-white/10'
            }`}
          >
            {locationEnabled ? 'Location enabled' : 'Enable location'}
          </button>
        </section>

        {/* Image / file access */}
        <section className="border-2 border-white p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase text-white/70">Image & file access</h2>
          <p className="text-sm text-white/60">
            Allow file access for personalized game assets and profile images.
          </p>
          <button
            onClick={() => setFileAccessEnabled(!fileAccessEnabled)}
            className={`w-full border-2 px-6 py-3 text-sm font-bold uppercase transition-colors ${
              fileAccessEnabled ? 'border-white bg-white text-black' : 'border-white hover:bg-white/10'
            }`}
          >
            {fileAccessEnabled ? 'File access enabled' : 'Enable file access'}
          </button>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full border-2 border-white px-6 py-4 font-bold uppercase hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <span className="text-white/60">Loading...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
