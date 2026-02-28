'use client';

import { useState, useEffect, useRef } from 'react';

const SOURCE_LABELS: Record<string, string> = {
  news: 'News',
  weather: 'Weather',
  terrain: 'Terrain',
  location: 'Location',
  spotify: 'Spotify',
  places: 'Nearby places',
  image: 'Image',
  playlist: 'Playlist',
};

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

const STORAGE_IMAGE_KEY = 'recesss_upload_image';
const STORAGE_PLAYLIST_KEY = 'recesss_upload_playlist';

export function TopRightIcons() {
  const [musicConnected, setMusicConnected] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [playlistUploaded, setPlaylistUploaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const playlistInputRef = useRef<HTMLInputElement>(null);

  const refreshConnections = () => {
    fetch('/api/connections', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => c && setMusicConnected(c.spotify ?? false))
      .catch(() => {});
  };

  useEffect(() => {
    refreshConnections();
  }, []);

  useEffect(() => {
    fetch('/api/ingest-status', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { sources: [] }))
      .then((d) => setSources(d.sources ?? []))
      .catch(() => setSources([]));
  }, [musicConnected, locationEnabled, imageUploaded, playlistUploaded]);

  const refreshUploadState = () => {
    setImageUploaded(!!sessionStorage.getItem(STORAGE_IMAGE_KEY));
    setPlaylistUploaded(!!sessionStorage.getItem(STORAGE_PLAYLIST_KEY));
  };

  useEffect(() => {
    refreshUploadState();
    window.addEventListener('recesss-storage-update', refreshUploadState);
    window.addEventListener('storage', refreshUploadState);
    return () => {
      window.removeEventListener('recesss-storage-update', refreshUploadState);
      window.removeEventListener('storage', refreshUploadState);
    };
  }, []);

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        sessionStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify({ base64, mimeType: file.type }));
        setImageUploaded(true);
        setToast('Image uploaded');
        setTimeout(() => setToast(null), 3000);
        window.dispatchEvent(new Event('recesss-storage-update'));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleMusic = () => {
    if (musicConnected) {
      playlistInputRef.current?.click();
    } else {
      window.location.href = '/api/auth/spotify';
    }
  };

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = text.startsWith('{') ? JSON.parse(text) : { tracks: [] };
        if (data.tracks || Array.isArray(data)) {
          sessionStorage.setItem(STORAGE_PLAYLIST_KEY, text);
          setPlaylistUploaded(true);
          setToast('Playlist uploaded');
          setTimeout(() => setToast(null), 3000);
          window.dispatchEvent(new Event('recesss-storage-update'));
        }
      } catch {
        // ignore invalid files
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLocation = () => {
    if (locationEnabled) return;
    navigator.geolocation.getCurrentPosition(
      () => setLocationEnabled(true),
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <input
          ref={playlistInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handlePlaylistChange}
        />
        <button
          onClick={handleImageUpload}
          className={`p-2 transition-colors ${imageUploaded ? 'text-white' : 'text-white/60 hover:text-white'}`}
          aria-label="Upload image"
          title="Upload image to generate game from"
        >
          {icons.upload}
        </button>
        <button
          onClick={handleMusic}
          className={`p-2 transition-colors ${musicConnected || playlistUploaded ? 'text-white' : 'text-white/60 hover:text-white'}`}
          aria-label="Music"
          title={musicConnected ? 'Upload playlist (JSON)' : 'Connect Spotify'}
        >
          {icons.music}
        </button>
        <button
          onClick={handleLocation}
          className={`p-2 transition-colors ${locationEnabled ? 'text-white' : 'text-white/60 hover:text-white'}`}
          aria-label="Location"
          title="Grant location access"
        >
          {icons.location}
        </button>
      </div>
      {(() => {
        const connected = [...sources];
        if (imageUploaded && !connected.includes('image')) connected.push('image');
        if (playlistUploaded && !connected.includes('playlist')) connected.push('playlist');
        return connected.length > 0 ? (
          <p className="text-xs text-white/50 text-right max-w-[220px]">
            In pipeline: {connected.map((s) => SOURCE_LABELS[s] ?? s).join(', ')}
          </p>
        ) : null;
      })()}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm rounded-lg border border-white/20 z-50"
          role="status"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
