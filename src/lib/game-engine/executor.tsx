'use client';

import { useState } from 'react';
import type { GameConfig } from '@/types';
import { RealWorldTask } from '@/components/games/RealWorldTask';

interface ExecutorProps {
  config: GameConfig;
}

export function GameExecutor({ config }: ExecutorProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative flex flex-col items-center w-full min-h-[320px]">
      <RealWorldTask config={config.config} ready={ready} />
      {!ready && (
        <div
          onClick={() => setReady(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 cursor-pointer rounded-lg p-6"
        >
          <div className="w-full max-w-lg flex flex-col items-center gap-4">
            {config.reasoning && (
              <p className="text-base text-white/90 text-center leading-relaxed w-full">
                {config.reasoning}
              </p>
            )}
            <p className="text-sm text-white/70 text-center w-full">
              Do a task, take a photo, we'll verify.
            </p>
            <p className="text-xs text-white/50 text-center w-full">
              Capture: Camera or upload photo when done
            </p>
            <p className="text-sm text-white font-medium uppercase text-center">Tap to play</p>
          </div>
        </div>
      )}
    </div>
  );
}
