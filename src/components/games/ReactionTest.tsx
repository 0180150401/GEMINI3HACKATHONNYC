'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  theme?: 'day' | 'night';
  difficulty?: number;
}

export function ReactionTest({ config, ready = true }: { config: Config; ready?: boolean }) {
  const [phase, setPhase] = useState<'ready' | 'waiting' | 'target' | 'result'>('ready');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const startTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const isDay = config.theme !== 'night';
  const difficulty = Math.min(10, Math.max(1, config.difficulty ?? 5));
  const minDelay = Math.max(1000, 2500 - difficulty * 150);
  const maxDelay = Math.max(2500, 4500 - difficulty * 100);

  const startRound = useCallback(() => {
    setPhase('waiting');
    setReactionMs(null);
    setRound((r) => r + 1);

    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    timeoutRef.current = setTimeout(() => {
      setPhase('target');
      startTimeRef.current = performance.now();
    }, delay);
  }, [minDelay, maxDelay]);

  const handleTap = useCallback(() => {
    if (phase === 'target') {
      const ms = Math.round(performance.now() - startTimeRef.current);
      setReactionMs(ms);
      setPhase('result');
    } else if (phase === 'ready' || phase === 'result') {
      startRound();
    } else if (phase === 'waiting') {
      setPhase('result');
      setReactionMs(-1);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    }
  }, [phase, startRound]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleTap]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const bg = isDay ? '#87CEEB' : '#0a0a1a';
  const fg = isDay ? '#1a1a1a' : '#e5e5e5';

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">
        Reaction Test — Round {round}
        {reactionMs !== null && reactionMs >= 0 && (
          <span className="ml-2 text-emerald-400">{reactionMs}ms</span>
        )}
        {reactionMs === -1 && (
          <span className="ml-2 text-amber-400">Too early!</span>
        )}
      </p>
      <div
        className="w-[400px] h-[300px] rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
        style={{ background: bg, color: fg }}
        onClick={handleTap}
      >
        {phase === 'ready' && (
          <p className="text-lg font-bold">Tap to start</p>
        )}
        {phase === 'waiting' && (
          <p className="text-lg font-medium">Wait for it...</p>
        )}
        {phase === 'target' && (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
            style={{ background: '#22c55e', color: 'white' }}
          >
            <span className="text-2xl font-bold">TAP</span>
          </div>
        )}
        {phase === 'result' && (
          <div className="text-center">
            {reactionMs !== null && reactionMs >= 0 ? (
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                {reactionMs}ms
              </p>
            ) : (
              <p className="text-xl font-bold text-amber-400">Too early! Wait for green.</p>
            )}
            <p className="text-sm mt-2">Tap to play again</p>
          </div>
        )}
      </div>
      <p className="text-sm text-zinc-500">SPACE or click when the green circle appears</p>
    </div>
  );
}
