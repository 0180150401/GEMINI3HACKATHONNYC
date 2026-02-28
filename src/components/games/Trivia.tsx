'use client';

interface Config {
  theme?: 'day' | 'night';
  difficulty?: number;
  [key: string]: unknown;
}

export function Trivia({ config, ready = true }: { config: Config; ready?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Trivia — Coming soon</p>
      <div
        className="w-[400px] h-[300px] rounded-lg bg-black flex items-center justify-center"
        style={{ minHeight: 300 }}
      >
        <p className="text-sm text-zinc-500">
          Answer questions from today&apos;s news. Tap to play when ready.
        </p>
      </div>
      <p className="text-sm text-zinc-500">Select the correct answer from news headlines</p>
    </div>
  );
}
