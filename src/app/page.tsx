'use client';

import { Countdown } from '@/components/Countdown';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-8">Recesss</h1>

      <Countdown />
    </div>
  );
}
