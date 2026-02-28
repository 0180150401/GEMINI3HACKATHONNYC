'use client';

interface Config {
  scrollSpeed?: number;
  theme?: 'day' | 'night';
  difficulty?: number;
  [key: string]: unknown;
}

export function ReactionTest({ config, ready = true }: { config: Config; ready?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Reaction Test — Coming soon</p>
      <div
        className="w-[400px] h-[300px] rounded-lg bg-black flex items-center justify-center cursor-pointer"
        style={{ minHeight: 300 }}
      >
        <p className="text-sm text-zinc-500">
          Tap or click when the cue appears. Tap to play when ready.
        </p>
      </div>
      <p className="text-sm text-zinc-500">SPACE or click when the target appears</p>
    </div>
  );
}
