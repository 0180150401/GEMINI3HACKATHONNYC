'use client';

import { useState } from 'react';
import type { GameConfig } from '@/types';
import { EndlessRunner } from '@/components/games/EndlessRunner';
import { ObstacleDodge } from '@/components/games/ObstacleDodge';
import { RhythmTap } from '@/components/games/RhythmTap';
import { MemoryMatch } from '@/components/games/MemoryMatch';
import { Trivia } from '@/components/games/Trivia';
import { ReactionTest } from '@/components/games/ReactionTest';
import { FaceDodge } from '@/components/games/FaceDodge';

interface ExecutorProps {
  config: GameConfig;
}

const HOW_TO_PLAY: Record<string, { desc: string; computer: string }> = {
  endless_runner: {
    desc: 'Auto-runner. Jump over terrain.',
    computer: 'SPACE / W / ↑ or click to jump',
  },
  obstacle_dodge: {
    desc: 'Dodge the red obstacles.',
    computer: '↑↓ or W/S to move. Tap top/bottom on mobile.',
  },
  rhythm_tap: {
    desc: 'Hit beats when they reach the zone.',
    computer: 'Click or press SPACE',
  },
  memory_match: {
    desc: 'Match pairs from your image.',
    computer: 'Click cards to flip and match',
  },
  trivia: {
    desc: 'Answer questions from news.',
    computer: 'Select the correct answer',
  },
  reaction_test: {
    desc: 'Tap when the cue appears.',
    computer: 'SPACE or click when target appears',
  },
  face_dodge: {
    desc: 'Dodge obstacles with your face.',
    computer: 'Move face left/right or use mouse/touch',
  },
};

function GameContent({ config, ready }: ExecutorProps & { ready: boolean }) {
  switch (config.gameType) {
    case 'endless_runner':
      return <EndlessRunner config={config.config} ready={ready} />;
    case 'obstacle_dodge':
      return <ObstacleDodge config={config.config} ready={ready} />;
    case 'rhythm_tap':
      return <RhythmTap config={config.config} ready={ready} />;
    case 'memory_match':
      return <MemoryMatch config={config.config} ready={ready} />;
    case 'trivia':
      return <Trivia config={config.config} ready={ready} />;
    case 'reaction_test':
      return <ReactionTest config={config.config} ready={ready} />;
    case 'face_dodge':
      return <FaceDodge config={config.config} ready={ready} />;
    default:
      return <ObstacleDodge config={config.config} ready={ready} />;
  }
}

export function GameExecutor({ config }: ExecutorProps) {
  const [ready, setReady] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      <GameContent config={config} ready={ready} />
      {!ready && (
        <div
          onClick={() => setReady(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 cursor-pointer rounded-lg"
        >
          {config.reasoning && (
            <p className="text-sm text-white/80 text-center max-w-[360px] px-4">
              {config.reasoning}
            </p>
          )}
          <p className="text-sm text-white/70">
            {(HOW_TO_PLAY[config.gameType] ?? HOW_TO_PLAY.obstacle_dodge).desc}
          </p>
          <p className="text-xs text-white/50">
            Computer: {(HOW_TO_PLAY[config.gameType] ?? HOW_TO_PLAY.obstacle_dodge).computer}
          </p>
          <p className="text-sm text-white font-medium uppercase">Tap to play</p>
        </div>
      )}
    </div>
  );
}
