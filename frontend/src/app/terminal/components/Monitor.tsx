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
}

export default function Monitor({ imageUrl }: MonitorProps) {
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

  useEffect(() => {
    if (showImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    // Read colors once and update when skin/theme attributes change.
    let color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#2dfe39';
    let monitorCanvasBg = getComputedStyle(document.documentElement).getPropertyValue('--skin-monitor-canvas-bg').trim() || '#0a0a0a';
    const observer = new MutationObserver(() => {
      color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#2dfe39';
      monitorCanvasBg = getComputedStyle(document.documentElement).getPropertyValue('--skin-monitor-canvas-bg').trim() || '#0a0a0a';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-skin'] });

    const draw = () => {
      time += 0.02;
      ctx.fillStyle = monitorCanvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
    };
  }, [showImage]);

  return (
    <div className="panel-box monitor-container">
      <div className="monitor-screen" aria-label="Monitor display">
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
      </div>
    </div>
  );
}
