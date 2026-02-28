'use client';

import { useCallback, useEffect, useState } from 'react';

interface Config {
  theme?: 'day' | 'night';
  difficulty?: number;
  [key: string]: unknown;
}

const EMOJI_PAIRS = ['🎮', '🎵', '🌙', '☀️', '🔥', '💧', '⚡', '🌟', '🎯', '🎪', '🏆', '🎸'];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MemoryMatch({ config, ready = true }: { config: Config; ready?: boolean }) {
  const difficulty = Math.min(10, Math.max(1, config.difficulty ?? 5));
  const pairCount = Math.min(8, Math.max(4, Math.floor(4 + difficulty / 2)));
  const emojis = shuffle(EMOJI_PAIRS.slice(0, pairCount).flatMap((e) => [e, e]));

  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>(
    () => emojis.map((emoji, id) => ({ id, emoji, flipped: false, matched: false }))
  );
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);

  const isDay = config.theme !== 'night';

  const handleClick = useCallback(
    (id: number) => {
      if (lock) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.flipped || card.matched) return;

      const newFlipped = [...flippedIds, id];
      setFlippedIds(newFlipped);
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
      );
      setMoves((m) => m + 1);

      if (newFlipped.length === 2) {
        setLock(true);
        const [a, b] = newFlipped;
        const cardA = cards.find((c) => c.id === a)!;
        const cardB = cards.find((c) => c.id === b)!;
        if (cardA.emoji === cardB.emoji) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === a || c.id === b ? { ...c, matched: true } : c
            )
          );
          setFlippedIds([]);
          setLock(false);
        } else {
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === a || c.id === b ? { ...c, flipped: false } : c
              )
            );
            setFlippedIds([]);
            setLock(false);
          }, 600);
        }
      }
    },
    [cards, flippedIds, lock]
  );

  const allMatched = cards.every((c) => c.matched);
  const bg = isDay ? '#87CEEB' : '#0a0a1a';
  const cardBg = isDay ? '#4a7c59' : '#1e3a2f';

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">
        Memory Match — Moves: {moves}
        {allMatched && <span className="ml-2 text-emerald-400">Done!</span>}
      </p>
      <div
        className="rounded-lg p-4 grid gap-2"
        style={{
          background: bg,
          gridTemplateColumns: 'repeat(4, 1fr)',
          width: 400,
        }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleClick(card.id)}
            disabled={card.matched || allMatched}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-2xl font-bold transition-all disabled:opacity-50"
            style={{
              background: card.flipped || card.matched ? 'transparent' : cardBg,
              border: card.flipped || card.matched ? 'none' : '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
      <p className="text-sm text-zinc-500">Click cards to flip and match pairs</p>
    </div>
  );
}
