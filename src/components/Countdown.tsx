'use client';

import { useState, useEffect } from 'react';

function getNextDrop(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setHours(6, 0, 0, 0);
  if (now >= next) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function formatTime(ms: number): { hours: number; minutes: number; seconds: number } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

export function Countdown() {
  const [remaining, setRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = getNextDrop();
      const ms = next.getTime() - Date.now();
      if (ms <= 0) {
        setRemaining(formatTime(0));
        return;
      }
      setRemaining(formatTime(ms));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!remaining) return null;

  return (
    <div className="text-center mb-12">
      <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Next Game Drop</p>
      <p className="text-sm text-white/70 mb-4">Daily at 6:00 AM · Resets every 24 hours</p>
      <div className="flex justify-center gap-4">
        <div className="border-2 border-white px-4 py-2 min-w-[4rem]">
          <span className="text-2xl font-bold tabular-nums">{String(remaining.hours).padStart(2, '0')}</span>
          <p className="text-xs uppercase text-white/50">hrs</p>
        </div>
        <div className="border-2 border-white px-4 py-2 min-w-[4rem]">
          <span className="text-2xl font-bold tabular-nums">{String(remaining.minutes).padStart(2, '0')}</span>
          <p className="text-xs uppercase text-white/50">min</p>
        </div>
        <div className="border-2 border-white px-4 py-2 min-w-[4rem]">
          <span className="text-2xl font-bold tabular-nums">{String(remaining.seconds).padStart(2, '0')}</span>
          <p className="text-xs uppercase text-white/50">sec</p>
        </div>
      </div>
    </div>
  );
}
