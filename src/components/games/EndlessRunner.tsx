'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  obstacleDensity?: number;
  terrainHeights?: number[];
  theme?: 'day' | 'night';
}

export function EndlessRunner({ config, ready = true }: { config: Config; ready?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scrollSpeed = config.scrollSpeed ?? 6;
  const terrainHeights = config.terrainHeights ?? Array(15).fill(0.5);
  const isDay = config.theme !== 'night';

  const run = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    const dpr = window.devicePixelRatio || 1;
    const w = 400;
    const h = 300;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    let playerY = h * 0.6;
    let playerVy = 0;
    let scrollX = 0;
    const playerW = 24;
    const playerH = 32;
    const groundY = h - 40;
    const terrainSegW = 60;
    const segs = Math.ceil(w / terrainSegW) + 2;
    let frame = 0;
    let jumping = false;

    const heights = [...terrainHeights];
    while (heights.length < segs) heights.push(heights[heights.length % heights.length] ?? 0.5);

    function draw() {
      ctx.fillStyle = isDay ? '#87CEEB' : '#0a0a1a';
      ctx.fillRect(0, 0, w, h);

      scrollX += scrollSpeed;
      frame++;

      for (let i = 0; i < segs; i++) {
        const segX = i * terrainSegW - (scrollX % terrainSegW);
        const th = heights[i] ?? 0.5;
        const segTop = groundY - th * 80;
        ctx.fillStyle = isDay ? '#4a7c59' : '#2d4a3e';
        ctx.fillRect(segX, segTop, terrainSegW + 2, h - segTop);
      }

      if (!jumping && (frame % 80 === 0)) {
        playerVy = -12;
        jumping = true;
      }
      playerVy += 0.6;
      playerY += playerVy;
      if (playerY > groundY - playerH) {
        playerY = groundY - playerH;
        playerVy = 0;
        jumping = false;
      }

      ctx.fillStyle = isDay ? '#e74c3c' : '#c0392b';
      ctx.fillRect(40, playerY, playerW, playerH);

      setScore(Math.floor(scrollX / 10));

      if (!gameOver) requestAnimationFrame(draw);
    }
    draw();
  }, [scrollSpeed, terrainHeights, isDay, gameOver]);

  useEffect(() => {
    if (ready && !gameOver) run();
  }, [run, gameOver, ready]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">Score: {score}</p>
      <canvas
        ref={canvasRef}
        className="rounded-lg bg-black"
        style={{ width: 400, height: 300 }}
      />
      <p className="text-sm text-zinc-500">Press to jump (auto-run)</p>
    </div>
  );
}
