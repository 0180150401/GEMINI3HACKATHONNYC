'use client';

interface Config {
  theme?: 'day' | 'night';
  difficulty?: number;
  [key: string]: unknown;
}

export function MemoryMatch({ config, ready = true }: { config: Config; ready?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Memory Match — Coming soon</p>
      <div
        className="w-[400px] h-[300px] rounded-lg bg-black flex items-center justify-center"
        style={{ minHeight: 300 }}
      >
        <p className="text-sm text-zinc-500">
          Match pairs from your uploaded image. Tap to play when ready.
        </p>
      </div>
      <p className="text-sm text-zinc-500">Click cards to flip and match pairs</p>
    </div>
  );
}
