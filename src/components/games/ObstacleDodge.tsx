'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  obstacleDensity?: number;
  theme?: 'day' | 'night';
}

const MOVE_SPEED = 5;

export function ObstacleDodge({ config, ready = true }: { config: Config; ready?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const moveDirRef = useRef(0);
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
    let gameOver = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        moveDirRef.current = -1;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        moveDirRef.current = 1;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (moveDirRef.current === -1) moveDirRef.current = 0;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        if (moveDirRef.current === 1) moveDirRef.current = 0;
      }
    };

    const handleTouchStart = (e: TouchEvent | MouseEvent) => {
      if (e instanceof TouchEvent) e.preventDefault();
      const clientY = e instanceof TouchEvent ? e.touches[0].clientY : e.clientY;
      const rect = canvas.getBoundingClientRect();
      const relY = clientY - rect.top;
      moveDirRef.current = relY < rect.height / 2 ? -1 : 1;
      const clearDir = () => { moveDirRef.current = 0; };
      window.addEventListener('touchend', clearDir, { once: true });
      window.addEventListener('mouseup', clearDir, { once: true });
    };

    canvas.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    canvas.addEventListener('mousedown', handleTouchStart as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function spawn(frame: number) {
      if (Math.random() < density * 0.15) {
        obstacles.push({
          x: w,
          y: Math.random() * (h - 80) + 40,
          w: 20,
          h: 40,
        });
      }
    }

    let frame = 0;
    let rafId: number;
    function draw() {
      ctx.fillStyle = isDay ? '#87CEEB' : '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      frame++;
      if (frame % 2 === 0) spawn(frame);

      playerY += moveDirRef.current * MOVE_SPEED;
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

      if (!gameOver) rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('touchstart', handleTouchStart as EventListener);
      canvas.removeEventListener('mousedown', handleTouchStart as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [scrollSpeed, density, isDay]);

  useEffect(() => {
    if (ready) return run();
  }, [run, ready]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Score: {score}</p>
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-black cursor-pointer"
        width={400}
        height={300}
      />
      <p className="text-sm text-zinc-500">↑↓ or W/S to move up and down</p>
    </div>
  );
}
