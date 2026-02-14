'use client';

import { useState, useEffect, useRef } from 'react';

interface MonitorState {
  type: 'idle' | 'image';
  imageUrl?: string;
}

export default function Monitor() {
  const [state, setState] = useState<MonitorState>({ type: 'idle' });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for display-image events
  useEffect(() => {
    const handleDisplay = (e: CustomEvent<{ imageUrl: string }>) => {
      setState({ type: 'image', imageUrl: e.detail.imageUrl });
    };

    const handleClear = () => {
      setState({ type: 'idle' });
    };

    window.addEventListener('display-image', handleDisplay as EventListener);
    window.addEventListener('clear-display', handleClear);

    return () => {
      window.removeEventListener('display-image', handleDisplay as EventListener);
      window.removeEventListener('clear-display', handleClear);
    };
  }, []);

  // Draw idle animation on canvas
  useEffect(() => {
    if (state.type !== 'idle' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let time = 0;

    const draw = () => {
      time += 0.02;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw matrix-style rain effect
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
  }, [state.type]);

  return (
    <div className="panel-box monitor-container">
      <div className="monitor-screen">
        {state.type === 'idle' && (
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        )}
        {state.type === 'image' && state.imageUrl && (
          <img
            src={state.imageUrl}
            alt="Display"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '4px',
              display: 'block',
            }}
          />
        )}
        {/* CRT overlay */}
        <div className="monitor-overlay" />
      </div>
    </div>
  );
}
