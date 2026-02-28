'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  scrollSpeed?: number;
  obstacleDensity?: number;
  theme?: 'day' | 'night';
}

const W = 400;
const H = 300;
const PLAYER_R = 20;

export function FaceDodge({ config, ready = true }: { config: Config; ready?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [faceMode, setFaceMode] = useState<'loading' | 'active' | 'fallback'>('loading');
  const playerXRef = useRef(W / 2);
  const faceDetectorRef = useRef<{
    detectForVideo: (
      frame: HTMLVideoElement,
      ts: number
    ) => { detections: Array<{ boundingBox?: { originX: number; originY: number; width: number; height: number } }> };
  } | null>(null);

  const scrollSpeed = config.scrollSpeed ?? 6;
  const density = Math.min(1, Math.max(0.1, config.obstacleDensity ?? 0.3));
  const isDay = config.theme !== 'night';

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        try {
          const { FilesetResolver, FaceDetector } = await import('@mediapipe/tasks-vision');
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
          );
          const detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.5,
          });
          if (!cancelled) {
            faceDetectorRef.current = detector as unknown as typeof faceDetectorRef.current;
            setFaceMode('active');
          }
        } catch {
          if (!cancelled) setFaceMode('fallback');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Camera denied');
      }
    };

    init();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [ready, stopStream]);

  useEffect(() => {
    if (!ready || error || faceMode === 'loading') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = W;
    canvas.height = H;

    const obstacles: { x: number; y: number; w: number; h: number }[] = [];
    let gameOver = false;
    let frame = 0;
    let lastTs = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (faceMode !== 'fallback') return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      playerXRef.current = (e.clientX - rect.left) * scaleX;
      playerXRef.current = Math.max(PLAYER_R, Math.min(W - PLAYER_R, playerXRef.current));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (faceMode !== 'fallback') return;
      e.preventDefault();
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      playerXRef.current = (t.clientX - rect.left) * scaleX;
      playerXRef.current = Math.max(PLAYER_R, Math.min(W - PLAYER_R, playerXRef.current));
    };

    if (faceMode === 'fallback') {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    function spawn() {
      if (Math.random() < density * 0.12) {
        obstacles.push({
          x: Math.random() * (W - 40) + 20,
          y: -30,
          w: 24,
          h: 24,
        });
      }
    }

    let rafId: number;
    function draw(ts: number) {
      if (gameOver || !ctx) return;

      if (faceMode === 'active' && faceDetectorRef.current && video && video.videoWidth > 0) {
        try {
          const result = faceDetectorRef.current.detectForVideo(video, ts);
          const det = result.detections?.[0];
          if (det?.boundingBox) {
            const box = det.boundingBox as { originX?: number; originY?: number; width?: number; height?: number };
            const cx = (box.originX ?? 0) + (box.width ?? 0) / 2;
            const vw = video.videoWidth;
            playerXRef.current = (cx / vw) * W;
            playerXRef.current = Math.max(PLAYER_R, Math.min(W - PLAYER_R, playerXRef.current));
          }
        } catch {
          // ignore detection errors
        }
      }

      ctx.fillStyle = isDay ? '#87CEEB' : '#0a0a1a';
      ctx.fillRect(0, 0, W, H);

      frame++;
      if (frame % 2 === 0) spawn();

      const px = playerXRef.current;

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(px, H - 50, PLAYER_R, 0, Math.PI * 2);
      ctx.fill();

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.y += scrollSpeed;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);

        if (o.y - o.h / 2 > H) {
          obstacles.splice(i, 1);
          setScore((s) => s + 1);
        } else if (
          Math.abs(o.x - px) < o.w / 2 + PLAYER_R &&
          Math.abs(o.y - (H - 50)) < o.h / 2 + PLAYER_R
        ) {
          gameOver = true;
        }
      }

      rafId = requestAnimationFrame(draw);
    }
    rafId = requestAnimationFrame((ts) => {
      lastTs = ts;
      draw(ts);
    });

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [ready, error, faceMode, scrollSpeed, density, isDay]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-red-400">Camera: {error}</p>
        <p className="text-sm text-zinc-500">Grant camera access to play Face Dodge</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">
        Face Dodge — Score: {score}
        {faceMode === 'active' && (
          <span className="ml-2 text-xs text-emerald-400">(face tracking)</span>
        )}
        {faceMode === 'fallback' && (
          <span className="ml-2 text-xs text-amber-400">(move mouse/touch)</span>
        )}
      </p>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg bg-black cursor-crosshair block"
          width={W}
          height={H}
        />
        {faceMode === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <p className="text-sm text-white/80">Starting camera...</p>
          </div>
        )}
      </div>
      <p className="text-sm text-zinc-500">
        {faceMode === 'active'
          ? 'Move your face left/right to dodge'
          : 'Move mouse or finger to dodge'}
      </p>
    </div>
  );
}
