'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_IMAGE_KEY = 'recesss_upload_image';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCaptured: () => void;
}

export function CameraCaptureModal({ open, onClose, onCaptured }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      return;
    }
    setError(null);
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Camera access denied');
      });
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setLoading(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoading(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setLoading(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          if (base64) {
            sessionStorage.setItem(STORAGE_IMAGE_KEY, JSON.stringify({ base64, mimeType: 'image/jpeg' }));
            stopStream();
            onCaptured();
            onClose();
            window.dispatchEvent(new Event('recesss-storage-update'));
          }
        };
        reader.readAsDataURL(blob);
        setLoading(false);
      },
      'image/jpeg',
      0.85
    );
  }, [onCaptured, onClose, stopStream]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
        <div className="aspect-video bg-black relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />
        </div>
        {error && (
          <p className="p-4 text-sm text-red-400">{error}</p>
        )}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium uppercase text-white/70 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error || loading}
            className="flex-1 py-2 text-sm font-bold uppercase bg-white text-black rounded disabled:opacity-50"
          >
            {loading ? 'Capturing...' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  );
}
