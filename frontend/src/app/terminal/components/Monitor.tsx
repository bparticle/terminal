'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Proxy Arweave/Irys image URLs through our Next.js server to avoid
 * client-side SSL or network issues with gateway.irys.xyz.
 */
function proxyUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'gateway.irys.xyz' || parsed.hostname === 'arweave.net') {
      return `/api/image?url=${encodeURIComponent(url)}`;
    }
  } catch { /* not a valid URL, return as-is */ }
  return url;
}

interface MonitorProps {
  imageUrl?: string | null;
  onOpenGallery?: () => void;
}

export default function Monitor({ imageUrl, onOpenGallery }: MonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Reset failure state when imageUrl changes
  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  const handleImgError = useCallback(() => {
    setImgFailed(true);
  }, []);

  const showImage = !!imageUrl && !imgFailed;
  const canOpenGallery = !!onOpenGallery;

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
      <button
        type="button"
        className={`monitor-screen ${canOpenGallery ? 'monitor-clickable' : ''}`}
        onClick={canOpenGallery ? onOpenGallery : undefined}
        aria-label={canOpenGallery ? 'Open NFT gallery' : 'Monitor display'}
        title={canOpenGallery ? 'Open gallery' : undefined}
      >
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
            src={proxyUrl(imageUrl!)}
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
      </button>
    </div>
  );
}
