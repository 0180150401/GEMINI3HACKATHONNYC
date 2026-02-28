'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Config {
  task?: string;
  verificationCriteria?: string;
  travelItinerary?: string;
  sideQuest?: string;
  theme?: 'day' | 'night';
}

const DEFAULT_TASK = 'Take a photo of your hand holding something green (plant, leaf, or grass)';
const DEFAULT_CRITERIA = 'hand visible holding a green plant, leaf, or grass';

export function RealWorldTask({ config, ready = true }: { config: Config; ready?: boolean }) {
  const task = config.task ?? DEFAULT_TASK;
  const criteria = config.verificationCriteria ?? DEFAULT_CRITERIA;
  const [phase, setPhase] = useState<'task' | 'capture' | 'verifying' | 'success' | 'fail'>('task');
  const [result, setResult] = useState<{ verified: boolean; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (phase !== 'capture') {
      stopStream();
      return;
    }
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError('Camera access denied'));
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [phase, stopStream]);

  const submitImage = useCallback(
    async (base64: string, mimeType: string, coords?: { lat: number; lng: number }) => {
      setPhase('verifying');
      setError(null);
      try {
        const body: Record<string, unknown> = {
          task,
          verificationCriteria: criteria,
          imageBase64: base64,
          imageMimeType: mimeType,
        };
        if (coords) {
          body.lat = coords.lat;
          body.lng = coords.lng;
        }
        const res = await fetch('/api/verify-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'Verification failed');
        setResult({ verified: data.verified ?? false, message: data.message });
        setPhase(data.verified ? 'success' : 'fail');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
        setPhase('capture');
      }
    },
    [task, criteria]
  );

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const doSubmit = (coords?: { lat: number; lng: number }) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const [header, base64] = dataUrl.split(',');
            const mime = header?.match(/data:(.+);base64/)?.[1] ?? 'image/jpeg';
            if (base64) submitImage(base64, mime, coords);
          };
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.85
      );
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doSubmit({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => doSubmit(),
        { timeout: 3000, maximumAge: 60000 }
      );
    } else {
      doSubmit();
    }
  }, [submitImage]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const [header, base64] = dataUrl.split(',');
        const mime = (header?.match(/data:(.+);base64/)?.[1] ?? file.type) || 'image/jpeg';
        if (base64) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => submitImage(base64, mime, { lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => submitImage(base64, mime),
              { timeout: 3000, maximumAge: 60000 }
            );
          } else {
            submitImage(base64, mime);
          }
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [submitImage]
  );

  const isDay = config.theme !== 'night';
  const bg = isDay ? '#e8f5e9' : '#1a2e1a';
  const fg = isDay ? '#1a1a1a' : '#e5e5e5';

  if (!ready) return null;

  const travelItinerary = config.travelItinerary;
  const sideQuest = config.sideQuest;

  // Task intro
  if (phase === 'task') {
    return (
      <div
        className="w-full min-w-0 max-w-xl rounded-lg p-6 flex flex-col gap-6"
        style={{ background: bg, color: fg }}
      >
        <p className="text-lg font-medium">Your task</p>
        <p className="text-base leading-relaxed break-words">{task}</p>
        {travelItinerary && (
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Travel itinerary</p>
            <p className="text-sm leading-relaxed break-words whitespace-pre-line opacity-90">{travelItinerary}</p>
          </div>
        )}
        {sideQuest && (
          <div>
            <p className="text-sm font-medium opacity-90 mb-1">Side quest</p>
            <p className="text-sm leading-relaxed break-words opacity-90 italic">{sideQuest}</p>
          </div>
        )}
        <p className="text-sm opacity-80">Take a photo when done. We'll verify.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setPhase('capture')}
            className="flex-1 py-3 px-4 text-sm font-bold uppercase bg-black text-white rounded hover:opacity-90"
          >
            Open camera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 px-4 text-sm font-bold uppercase border-2 border-current rounded hover:opacity-80"
          >
            Upload photo
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // Camera capture
  if (phase === 'capture') {
    return (
      <div
        className="w-full min-w-0 max-w-xl rounded-lg overflow-hidden flex flex-col"
        style={{ background: bg, color: fg }}
      >
        <div className="aspect-video bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        {error && <p className="p-2 text-sm text-red-600">{error}</p>}
        <div className="p-4 flex gap-3">
          <button
            onClick={() => setPhase('task')}
            className="flex-1 py-2 text-sm font-medium uppercase opacity-70 hover:opacity-100"
          >
            Back
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error}
            className="flex-1 py-2 text-sm font-bold uppercase bg-black text-white rounded disabled:opacity-50"
          >
            Capture & verify
          </button>
        </div>
      </div>
    );
  }

  // Verifying (also handle file upload flow - user selected file, now we're verifying)
  if (phase === 'verifying') {
    return (
      <div
        className="w-full min-w-0 max-w-xl rounded-lg p-8 flex flex-col items-center gap-4"
        style={{ background: bg, color: fg }}
      >
        <p className="text-lg font-medium">Verifying...</p>
        <div className="w-10 h-10 border-2 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success or fail
  const isSuccess = phase === 'success';
  return (
    <div
      className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
      style={{ background: isSuccess ? '#1b5e20' : '#b71c1c', color: '#fff' }}
    >
      <p className="text-xl font-bold">{isSuccess ? 'Task verified!' : 'Task not verified'}</p>
      {result?.message && <p className="text-sm opacity-90">{result.message}</p>}
      <button
        onClick={() => {
          setPhase('task');
          setResult(null);
          setError(null);
        }}
        className="py-2 px-4 text-sm font-bold uppercase bg-white text-black rounded hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
