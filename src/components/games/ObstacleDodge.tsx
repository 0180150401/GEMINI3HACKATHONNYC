'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  obstacleDensity?: number;
  theme?: 'day' | 'night';
}

export function ObstacleDodge({ config }: { config: Config }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scrollSpeed = config.scrollSpeed ?? 6;
  const density = Math.min(1, Math.max(0.1, config.obstacleDensity ?? 0.3));
  const isDay = config.theme !== 'night';

  const run = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    const w = 400;
    const h = 300;
    canvas.width = w;
    canvas.height = h;

    let playerY = h / 2;
    const obstacles: { x: number; y: number; w: number; h: number }[] = [];
    let frame = 0;
    let gameOver = false;

    function spawn() {
      if (Math.random() < density * 0.15) {
        obstacles.push({
          x: w,
          y: Math.random() * (h - 80) + 40,
          w: 20,
          h: 40,
        });
      }
    }

    function draw() {
      ctx.fillStyle = isDay ? '#87CEEB' : '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      frame++;
      if (frame % 2 === 0) spawn();

      playerY += (Math.sin(frame * 0.05) * 0.5);
      playerY = Math.max(30, Math.min(h - 30, playerY));

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(60, playerY, 16, 0, Math.PI * 2);
      ctx.fill();

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= scrollSpeed;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(o.x, o.y, o.w, o.h);

        if (o.x + o.w < 0) {
          obstacles.splice(i, 1);
          setScore((s) => s + 1);
        } else if (o.x < 90 && o.x + o.w > 30 && Math.abs(o.y + o.h / 2 - playerY) < 40) {
          gameOver = true;
        }
      }

      if (!gameOver) requestAnimationFrame(draw);
    }
    draw();
  }, [scrollSpeed, density, isDay]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Score: {score}</p>
      <canvas
        ref={canvasRef}
        className="rounded-lg border border-zinc-700 bg-black"
        width={400}
        height={300}
      />
      <p className="text-sm text-zinc-500">Dodge the red obstacles</p>
    </div>
  );
}
