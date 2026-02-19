'use client';

import { useEffect, useRef, useMemo } from 'react';

/* ── 5×7 pixel font bitmaps ─────────────────────────────────── */
const FONT: Record<string, number[][]> = {
  S: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
  C: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0]],
  A: [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  N: [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1]],
  L: [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  I: [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
  E: [[1,1,1,1,1],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
};

const TEXT = 'SCANLINES';
const CHAR_W = 5;
const CHAR_H = 7;
const GAP = 2;
const PAD = 3;
const PX = 10;

interface Px {
  gx: number;
  gy: number;
}

function buildPixels(): Px[] {
  const out: Px[] = [];
  let ox = 0;
  for (const ch of TEXT) {
    const g = FONT[ch];
    if (!g) { ox += CHAR_W + GAP; continue; }
    for (let r = 0; r < CHAR_H; r++)
      for (let c = 0; c < CHAR_W; c++)
        if (g[r][c]) out.push({ gx: PAD + ox + c, gy: PAD + r });
    ox += CHAR_W + GAP;
  }
  return out;
}

const GW = PAD * 2 + TEXT.length * CHAR_W + (TEXT.length - 1) * GAP;
const GH = PAD * 2 + CHAR_H;
const CW = GW * PX;
const CH = GH * PX;

function getTheme() {
  const s = getComputedStyle(document.documentElement);
  return {
    color: s.getPropertyValue('--primary-color').trim() || '#2dfe39',
    rgb: s.getPropertyValue('--primary-rgb').trim() || '45, 254, 57',
  };
}

function drawScanlines(ctx: CanvasRenderingContext2D, t: number, alpha = 0.25) {
  const period = 4;
  const off = (t * 18) % period;
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  for (let y = off; y < CH; y += period)
    ctx.fillRect(0, y, CW, period / 2);
}

function drawVignette(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createRadialGradient(CW / 2, CH / 2, CH * 0.5, CW / 2, CH / 2, CW * 0.62);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CW, CH);
}

/* ════════════════════════════════════════════════════════════════
   Variant 1 — CRT Jitter
   Pixels subtly vibrate around their home position.
   Phosphor glow, rolling scanlines, gentle flicker.
   ════════════════════════════════════════════════════════════════ */
function v1(ctx: CanvasRenderingContext2D, px: Px[], t: number) {
  const { color, rgb } = getTheme();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CW, CH);

  const flicker = 0.92 + Math.sin(t * 47) * 0.08;
  ctx.globalAlpha = flicker;
  ctx.shadowColor = `rgba(${rgb}, 0.5)`;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;

  for (const p of px) {
    const jx = Math.sin(t * 4.1 + p.gx * 1.7 + p.gy * 2.3) * 1.3;
    const jy = Math.cos(t * 3.3 + p.gx * 2.1 + p.gy * 1.1) * 1.3;
    ctx.fillRect(p.gx * PX + jx + 1, p.gy * PX + jy + 1, PX - 2, PX - 2);
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  drawScanlines(ctx, t);
  drawVignette(ctx);
}

/* ════════════════════════════════════════════════════════════════
   Variant 2 — Bad Signal
   Horizontal sine-wave distortion, breathing amplitude,
   static noise bursts, brief vertical-hold glitches.
   ════════════════════════════════════════════════════════════════ */
function v2(ctx: CanvasRenderingContext2D, px: Px[], t: number) {
  const { color, rgb } = getTheme();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CW, CH);

  const amp = 5 + Math.sin(t * 0.6) * 3.5;
  const vertGlitch = Math.sin(t * 3.1) > 0.97 ? Math.sin(t * 50) * 12 : 0;

  ctx.shadowColor = `rgba(${rgb}, 0.35)`;
  ctx.shadowBlur = 5;
  ctx.fillStyle = color;

  for (const p of px) {
    const wave = Math.sin(p.gy * 0.8 + t * 2.5) * amp;
    const stretch = 1 + Math.cos(p.gy * 0.8 + t * 2.5) * 0.12;
    const x = p.gx * PX + wave;
    const y = p.gy * PX + vertGlitch;
    ctx.fillRect(x + 1, y + 1, (PX - 2) * stretch, PX - 2);
  }

  ctx.shadowBlur = 0;

  if (Math.sin(t * 4.7) > 0.93) {
    ctx.fillStyle = `rgba(${rgb}, 0.04)`;
    for (let i = 0; i < 400; i++)
      ctx.fillRect(Math.random() * CW, Math.random() * CH, 3, 1);
  }

  drawScanlines(ctx, t, 0.35);
  drawVignette(ctx);
}

/* ════════════════════════════════════════════════════════════════
   Variant 3 — Chromatic Glitch
   RGB channel separation with drifting offsets.
   Periodic glitch events shift random horizontal strips.
   ════════════════════════════════════════════════════════════════ */
function v3(ctx: CanvasRenderingContext2D, px: Px[], t: number) {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, CW, CH);

  const rx = Math.sin(t * 1.1) * 3.5;
  const ry = Math.cos(t * 0.8) * 0.8;
  const bx = Math.sin(t * 1.4 + 2) * 3.5;
  const by = Math.cos(t * 1.0 + 1.5) * 0.8;

  const glitch = Math.sin(t * 6.1) > 0.88;
  const strips = glitch
    ? Array.from({ length: 4 }, () => ({
        row: Math.floor(PAD + Math.random() * CHAR_H),
        dx: (Math.random() - 0.5) * 28,
      }))
    : [];

  ctx.globalCompositeOperation = 'screen';

  const passes: Array<[string, number, number, number]> = [
    ['rgba(255,40,40,0.65)', rx, ry, 1],
    ['rgba(40,255,40,0.65)', 0, 0, 0.5],
    ['rgba(80,80,255,0.65)', bx, by, -0.7],
  ];

  for (const [fill, ox, oy, sm] of passes) {
    ctx.fillStyle = fill;
    for (const p of px) {
      let gs = 0;
      for (const s of strips)
        if (p.gy === s.row) gs = s.dx * sm;
      ctx.fillRect(p.gx * PX + ox + gs + 1, p.gy * PX + oy + 1, PX - 2, PX - 2);
    }
  }

  ctx.globalCompositeOperation = 'source-over';

  if (glitch) {
    for (const s of strips) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, s.row * PX, CW, PX);
    }
  }

  drawScanlines(ctx, t, 0.15);
  drawVignette(ctx);
}

/* ════════════════════════════════════════════════════════════════
   Variant 4 — Phosphor Trace
   CRT electron-beam sweep with phosphor decay.
   Pixels light up as the beam passes and slowly dim.
   ════════════════════════════════════════════════════════════════ */
interface PhState {
  brightness: Float32Array;
  cursor: number;
  sorted: Px[];
}

function v4(ctx: CanvasRenderingContext2D, _px: Px[], t: number, st: PhState) {
  const { rgb } = getTheme();
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, CW, CH);

  const speed = 3;
  const spread = 8;
  const N = st.sorted.length;

  for (let i = 0; i < N; i++) st.brightness[i] *= 0.94;

  st.cursor = (st.cursor + speed) % N;
  for (let d = 0; d < spread; d++) {
    const idx = (Math.floor(st.cursor) + d) % N;
    const intensity = 1 - (d / spread) * 0.6;
    st.brightness[idx] = Math.max(st.brightness[idx], intensity);
  }

  ctx.fillStyle = `rgba(${rgb}, 0.03)`;
  for (const p of st.sorted)
    ctx.fillRect(p.gx * PX + 1, p.gy * PX + 1, PX - 2, PX - 2);

  for (let i = 0; i < N; i++) {
    const b = st.brightness[i];
    if (b < 0.03) continue;
    const p = st.sorted[i];
    ctx.shadowColor = `rgba(${rgb}, ${(b * 0.6).toFixed(2)})`;
    ctx.shadowBlur = b * 12;
    ctx.fillStyle = `rgba(${rgb}, ${b.toFixed(2)})`;
    ctx.fillRect(p.gx * PX + 1, p.gy * PX + 1, PX - 2, PX - 2);
  }

  ctx.shadowBlur = 0;

  const beamPx = st.sorted[Math.floor(st.cursor)];
  if (beamPx) {
    ctx.fillStyle = `rgba(${rgb}, 0.025)`;
    ctx.fillRect(0, beamPx.gy * PX, CW, PX);
  }

  drawScanlines(ctx, t, 0.2);
  drawVignette(ctx);
}

/* ════════════════════════════════════════════════════════════════
   Variant 5 — Living Particles
   Pixel-particles with spring physics, Brownian noise,
   periodic scatter impulses, and luminous trails.
   ════════════════════════════════════════════════════════════════ */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hx: number;
  hy: number;
}
interface PtState {
  particles: Particle[];
  lastScatter: number;
}

function v5(ctx: CanvasRenderingContext2D, _px: Px[], t: number, st: PtState) {
  const { rgb } = getTheme();

  ctx.fillStyle = 'rgba(10,10,10,0.22)';
  ctx.fillRect(0, 0, CW, CH);

  const k = 1.4;
  const damp = 0.9;
  const noise = 0.6;

  if (t - st.lastScatter > 4.5) {
    st.lastScatter = t;
    for (const p of st.particles) {
      p.vx += (Math.random() - 0.5) * 70;
      p.vy += (Math.random() - 0.5) * 50;
    }
  }

  for (const p of st.particles) {
    const dx = p.hx - p.x;
    const dy = p.hy - p.y;
    p.vx = (p.vx + dx * k) * damp + (Math.random() - 0.5) * noise;
    p.vy = (p.vy + dy * k) * damp + (Math.random() - 0.5) * noise;
    p.x += p.vx / 60;
    p.y += p.vy / 60;

    const dist = Math.sqrt(dx * dx + dy * dy);
    const alpha = Math.max(0.2, Math.min(1, 1 - dist / 50));

    ctx.shadowColor = `rgba(${rgb}, ${(alpha * 0.45).toFixed(2)})`;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(2)})`;
    const half = (PX - 2) / 2;
    ctx.fillRect(p.x - half, p.y - half, PX - 2, PX - 2);
  }

  ctx.shadowBlur = 0;
  drawScanlines(ctx, t, 0.18);
}

/* ── Component ───────────────────────────────────────────────── */
interface Props {
  variant: 1 | 2 | 3 | 4 | 5;
}

export default function ScanlineTitle({ variant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixels = useMemo(buildPixels, []);
  const stateRef = useRef<PhState | PtState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    if (variant === 4) {
      const sorted = [...pixels].sort((a, b) => a.gy - b.gy || a.gx - b.gx);
      stateRef.current = {
        brightness: new Float32Array(sorted.length),
        cursor: 0,
        sorted,
      };
    } else if (variant === 5) {
      stateRef.current = {
        particles: pixels.map((p) => ({
          x: p.gx * PX + PX / 2,
          y: p.gy * PX + PX / 2,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          hx: p.gx * PX + PX / 2,
          hy: p.gy * PX + PX / 2,
        })),
        lastScatter: 0,
      };
    }

    let id: number;
    const t0 = performance.now();

    const frame = () => {
      const t = (performance.now() - t0) / 1000;
      switch (variant) {
        case 1: v1(ctx, pixels, t); break;
        case 2: v2(ctx, pixels, t); break;
        case 3: v3(ctx, pixels, t); break;
        case 4: v4(ctx, pixels, t, stateRef.current as PhState); break;
        case 5: v5(ctx, pixels, t, stateRef.current as PtState); break;
      }
      id = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(id);
  }, [variant, pixels]);

  return (
    <canvas
      ref={canvasRef}
      width={CW}
      height={CH}
      style={{
        width: '100%',
        maxWidth: `${CW}px`,
        height: 'auto',
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}
