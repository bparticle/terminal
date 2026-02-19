'use client';

import ScanlineTitle from '../components/ScanlineTitle';
import '../game-terminal.css';

const VARIANTS: Array<{ id: 1 | 2 | 3 | 4 | 5; name: string; desc: string }> = [
  { id: 1, name: 'CRT Jitter', desc: 'Subtle pixel vibration with phosphor glow and rolling scanlines' },
  { id: 2, name: 'Bad Signal', desc: 'Horizontal wave distortion with static bursts and vertical-hold glitches' },
  { id: 3, name: 'Chromatic Glitch', desc: 'RGB channel separation with random strip-shift glitch events' },
  { id: 4, name: 'Phosphor Trace', desc: 'Electron-beam raster sweep with phosphor decay trail' },
  { id: 5, name: 'Living Particles', desc: 'Spring-physics particles with scatter impulses and luminous trails' },
];

export default function TitlePreviewPage() {
  return (
    <div className="terminal-page" style={{ padding: '40px 20px', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: "'VT323', monospace",
            color: 'var(--primary-color)',
            fontSize: '28px',
            marginBottom: '10px',
            textAlign: 'center',
            textShadow: '0 0 10px var(--primary-glow)',
          }}
        >
          TITLE HEADER VARIANTS
        </h1>
        <p
          style={{
            fontFamily: "'VT323', monospace",
            color: 'var(--primary-dim)',
            fontSize: '16px',
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          Pick a style to fine-tune. All variants respond to the active theme color.
        </p>

        {VARIANTS.map((v) => (
          <div key={v.id} style={{ marginBottom: '50px' }}>
            <div
              style={{
                fontFamily: "'VT323', monospace",
                color: 'var(--primary-color)',
                fontSize: '20px',
                marginBottom: '6px',
              }}
            >
              [{v.id}] {v.name}
            </div>
            <div
              style={{
                fontFamily: "'VT323', monospace",
                color: 'var(--primary-dim)',
                fontSize: '14px',
                marginBottom: '14px',
              }}
            >
              {v.desc}
            </div>
            <div
              style={{
                border: '1px solid rgba(var(--primary-rgb), 0.2)',
                borderRadius: '8px',
                padding: '20px',
                background: '#0a0a0a',
                display: 'flex',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <ScanlineTitle variant={v.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
