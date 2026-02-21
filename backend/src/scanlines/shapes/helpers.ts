/**
 * Drawing Primitives & Color Utilities
 *
 * Low-level helpers used by shape definitions to draw pixel art
 * onto a 32x32 canvas. Import these in your shape files.
 */

// ─── Grid Constant ──────────────────────────────────────────────────────────

export const GRID = 32;

// ─── Drawing Primitives ─────────────────────────────────────────────────────

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), 1, 1);
}

export function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

export function hline(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, color: string): void {
  rect(ctx, x, y, len, 1, color);
}

export function vline(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, color: string): void {
  rect(ctx, x, y, 1, len, color);
}

// ─── Grid Renderer ──────────────────────────────────────────────────────────
// Used by exported shape files: renders a string-encoded grid onto the canvas
// mapping role indices to palette colors.

import type { ColorPalette } from '../traits';

const ROLE_MAP: Record<string, (pal: ColorPalette) => string> = {
  skin:       pal => pal.skin,
  skinShadow: pal => pal.skinShadow,
  eyes:       pal => pal.eyes,
  mouth:      pal => pal.mouth,
  hair:       pal => pal.hair,
  bg:         pal => pal.bg,
  bgLight:    pal => lighten(pal.bg, 15),
  accent:     pal => pal.accent,
};

/**
 * Render a string-encoded grid onto a canvas.
 * Each row is a string of digits where '0' = transparent and '1'..'9' map
 * to the roles array (1-indexed). This is the format exported by the editor.
 */
export function renderGrid(
  ctx: CanvasRenderingContext2D,
  pal: ColorPalette,
  roles: readonly string[],
  gridRows: readonly string[],
): void {
  for (let y = 0; y < gridRows.length; y++) {
    const row = gridRows[y];
    for (let x = 0; x < row.length; x++) {
      const idx = row.charCodeAt(x) - 48; // '0'=0, '1'=1, etc.
      if (idx <= 0) continue;
      const role = roles[idx - 1];
      const resolve = ROLE_MAP[role];
      if (resolve) px(ctx, x, y, resolve(pal));
    }
  }
}

// ─── Color Utilities ────────────────────────────────────────────────────────

export function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

export function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [r, g, b].map(v => c(v).toString(16).padStart(2, '0')).join('');
}

export function lighten(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  return toHex(r + amount, g + amount, b + amount);
}

export function darken(hex: string, amount: number): string {
  return lighten(hex, -amount);
}

export function lerpColor(hex1: string, hex2: string, t: number): string {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
