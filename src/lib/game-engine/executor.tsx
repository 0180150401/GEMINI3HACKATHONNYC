'use client';

import type { GameConfig } from '@/types';
import { EndlessRunner } from '@/components/games/EndlessRunner';
import { ObstacleDodge } from '@/components/games/ObstacleDodge';
import { RhythmTap } from '@/components/games/RhythmTap';

interface ExecutorProps {
  config: GameConfig;
}

export function GameExecutor({ config }: ExecutorProps) {
  switch (config.gameType) {
    case 'endless_runner':
      return <EndlessRunner config={config.config} />;
    case 'obstacle_dodge':
      return <ObstacleDodge config={config.config} />;
    case 'rhythm_tap':
      return <RhythmTap config={config.config} />;
    default:
      return <ObstacleDodge config={config.config} />;
  }
}
