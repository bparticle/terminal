'use client';

import { useEffect, useState } from 'react';

interface ComingSoonProps {
  message?: string;
}

export default function ComingSoon({ message = 'COMING SOON' }: ComingSoonProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    const fullText = `> ${message}`;
    let i = 0;
    setDisplayedText('');

    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'VT323', 'Courier New', monospace",
        color: '#00ff41',
        overflow: 'hidden',
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* CRT vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '2rem' }}>
        <div
          style={{
            fontSize: 'clamp(1rem, 4vw, 2rem)',
            textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41',
            marginBottom: '2rem',
            letterSpacing: '0.15em',
          }}
        >
          ╔══════════════════════════════════╗
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 6vw, 3.5rem)',
            textShadow: '0 0 20px #00ff41, 0 0 40px #00ff41',
            letterSpacing: '0.2em',
            margin: '0 0 1.5rem 0',
          }}
        >
          SCANLINES
        </h1>

        <div
          style={{
            fontSize: 'clamp(1rem, 3vw, 1.5rem)',
            textShadow: '0 0 8px #00ff41',
            minHeight: '2em',
          }}
        >
          {displayedText}
          <span
            style={{
              opacity: cursorVisible ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          >
            █
          </span>
        </div>

        <div
          style={{
            fontSize: 'clamp(1rem, 4vw, 2rem)',
            textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41',
            marginTop: '2rem',
            letterSpacing: '0.15em',
          }}
        >
          ╚══════════════════════════════════╝
        </div>
      </div>
    </div>
  );
}
