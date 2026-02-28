'use client';

import { useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  theme?: 'day' | 'night';
}

export function RhythmTap({ config, ready = true }: { config: Config; ready?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const scrollSpeed = config.scrollSpeed ?? 6;
  const isDay = config.theme !== 'night';

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    const w = 400;
    const h = 300;
    canvas.width = w;
    canvas.height = h;

    const beats: { x: number; hit: boolean }[] = [];
    let frame = 0;
    const beatInterval = Math.max(20, 60 - scrollSpeed * 3);
    let cancelled = false;

    const handleTap = () => {
      const hitZone = 80;
      for (const b of beats) {
        if (!b.hit && Math.abs(b.x - 100) < hitZone) {
          b.hit = true;
          setScore((s) => s + 1);
          setCombo((c) => c + 1);
          return;
        }
      }
      setCombo(0);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleTap();
      }
    };

    canvas.addEventListener('click', handleTap as EventListener);
    window.addEventListener('keydown', handleKey);

    function draw() {
      if (cancelled) return;
      ctx.fillStyle = isDay ? '#1e293b' : '#0f172a';
      ctx.fillRect(0, 0, w, h);

      frame++;
      if (frame % beatInterval === 0) beats.push({ x: w, hit: false });

      ctx.fillStyle = '#6366f1';
      ctx.fillRect(95, h / 2 - 30, 10, 60);

      for (let i = beats.length - 1; i >= 0; i--) {
        const b = beats[i];
        b.x -= scrollSpeed;
        ctx.fillStyle = b.hit ? '#22c55e' : '#a78bfa';
        ctx.beginPath();
        ctx.arc(b.x, h / 2, 12, 0, Math.PI * 2);
        ctx.fill();

        if (b.x < -20) beats.splice(i, 1);
      }

      requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelled = true;
      canvas.removeEventListener('click', handleTap as EventListener);
      window.removeEventListener('keydown', handleKey);
    };
  }, [scrollSpeed, isDay, ready]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Score: {score} | Combo: {combo}</p>
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-black cursor-pointer"
        width={400}
        height={300}
      />
      <p className="text-sm text-zinc-500">Click when the circle hits the line</p>
    </div>
  );
}
