'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'recesss_data_toggles';

export interface DataToggles {
  music: boolean;
  location: boolean;
  friends: boolean;
}

function loadToggles(): DataToggles {
  if (typeof window === 'undefined') return { music: false, location: false, friends: false };
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as DataToggles;
  } catch {}
  return { music: false, location: false, friends: false };
}

function saveToggles(t: DataToggles) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}

export function DataToggleBar() {
  const searchParams = useSearchParams();
  const [toggles, setToggles] = useState<DataToggles>(loadToggles);

  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') {
      setToggles((p) => {
        const next = { ...p, music: true };
        saveToggles(next);
        return next;
      });
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  useEffect(() => {
    saveToggles(toggles);
  }, [toggles]);

  const toggle = (key: keyof DataToggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    if (key === 'music' && !toggles.music) {
      window.location.href = '/api/auth/spotify';
    }
    if (key === 'location' && !toggles.location) {
      navigator.geolocation.getCurrentPosition(
        () => setToggles((p) => ({ ...p, location: true })),
        () => {}
      );
    }
  };

  return (
    <div className="fixed bottom-14 left-0 right-0 border-t-2 border-white bg-black py-4 px-6 z-40">
      <div className="max-w-lg mx-auto flex justify-between items-center gap-6">
        <button
          onClick={() => toggle('music')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 transition-colors ${
            toggles.music ? 'border-white bg-white text-black' : 'border-white hover:bg-white/10'
          }`}
        >
          <span className="text-xs font-bold uppercase">Music</span>
        </button>
        <button
          onClick={() => toggle('location')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 transition-colors ${
            toggles.location ? 'border-white bg-white text-black' : 'border-white hover:bg-white/10'
          }`}
        >
          <span className="text-xs font-bold uppercase">Location</span>
        </button>
        <button
          onClick={() => toggle('friends')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 transition-colors ${
            toggles.friends ? 'border-white bg-white text-black' : 'border-white hover:bg-white/10'
          }`}
        >
          <span className="text-xs font-bold uppercase">Friends</span>
        </button>
      </div>
    </div>
  );
}
