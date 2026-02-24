'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MAX_RETRIES = 4;
const RETRY_DELAYS = [2000, 4000, 8000, 15000];

interface MonitorProps {
  imageUrl?: string | null;
}

export default function Monitor({ imageUrl }: MonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [retrySrc, setRetrySrc] = useState<string | null>(null);

  // Reset state when imageUrl changes
  useEffect(() => {
    setImgFailed(false);
    setRetrySrc(null);
    retryCountRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, [imageUrl]);

  const handleImgError = useCallback(() => {
    if (retryCountRef.current < MAX_RETRIES && imageUrl) {
      const delay = RETRY_DELAYS[retryCountRef.current] || 15000;
      retryCountRef.current++;
      retryTimerRef.current = setTimeout(() => {
        // Append cache-buster to force a fresh request
        const sep = imageUrl.includes('?') ? '&' : '?';
        setRetrySrc(`${imageUrl}${sep}_r=${retryCountRef.current}`);
      }, delay);
    } else {
      setImgFailed(true);
    }
  }, [imageUrl]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  const showImage = !!imageUrl && !imgFailed;

  useEffect(() => {
    if (showImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--primary-color').trim() || '#2dfe39';

      ctx.font = '10px VT323';
      ctx.fillStyle = color;

      for (let x = 0; x < canvas.width; x += 14) {
        const y = (time * 30 + x * 7) % (canvas.height + 20);
        const char = String.fromCharCode(33 + Math.floor(Math.random() * 93));
        ctx.globalAlpha = 0.1 + Math.random() * 0.3;
        ctx.fillText(char, x, y);
      }

      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animFrame);
  }, [showImage]);

  return (
    <div className="panel-box monitor-container">
      <div className="monitor-screen">
        {!showImage && (
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        )}
        {showImage && (
          <img
            src={retrySrc || imageUrl!}
            alt="PFP Avatar"
            onError={handleImgError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              display: 'block',
            }}
          />
        )}
        <div className="monitor-overlay" />
      </div>
    </div>
  );
}
