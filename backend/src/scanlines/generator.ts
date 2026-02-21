/**
 * Procedural Face Generator (Node.js / node-canvas adaptation)
 *
 * Adapted from scanlines/src/core/generator.ts.
 * Uses `canvas` package instead of DOM `document.createElement('canvas')`.
 */

import { createCanvas, type Canvas } from 'canvas';
import { SeededRandom, randomSeed } from './random';
import {
  COLOR_PALETTES, FACE_SHAPES, EYE_TYPES, MOUTH_STYLES,
  ACCESSORIES, BG_PATTERNS, CLOTHING_TYPES, HAIR_STYLES, PIXEL_STYLES,
  type FaceTraits, type TraitOverrides, type ColorPalette, type PaletteDef,
  type FaceShape, type EyeType, type MouthStyle,
  type Accessory, type ClothingType, type BgPattern, type HairStyle,
  type PixelStyle,
} from './traits';
import { getShapeDef } from './shapes/registry';
import { rect, vline, darken } from './shapes/helpers';

// ─── Grid Constants ─────────────────────────────────────────────────────────

const GRID = 32;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Generate a face with optional trait overrides.
 * Returns node-canvas Canvas objects instead of HTMLCanvasElement.
 */
export function generateFace(
  size: number,
  seed?: number,
  overrides?: TraitOverrides,
): { canvas: Canvas; gridCanvas: Canvas; traits: FaceTraits } {
  const s = seed ?? randomSeed();
  const rng = new SeededRandom(s);

  const palDef = resolvePaletteDef(rng, overrides?.palette);
  const palette = resolveColorAssignment(rng, palDef);

  const traits: FaceTraits = {
    seed: s,
    palette,
    paletteName: palDef.name,
    faceShape: resolveWeighted(rng, FACE_SHAPES, overrides?.faceShape),
    hairStyle: resolveWeighted(rng, HAIR_STYLES, overrides?.hairStyle),
    eyeType: resolveWeighted(rng, EYE_TYPES, overrides?.eyeType),
    mouthStyle: resolveWeighted(rng, MOUTH_STYLES, overrides?.mouthStyle),
    accessory: resolveWeighted(rng, ACCESSORIES, overrides?.accessory),
    clothing: resolveWeighted(rng, CLOTHING_TYPES, overrides?.clothing),
    bgPattern: resolveWeighted(rng, BG_PATTERNS, overrides?.bgPattern),
    pixelStyle: resolveWeighted(rng, PIXEL_STYLES, overrides?.pixelStyle),
  };

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const gridCanvas = createCanvas(GRID, GRID);
  const gctx = gridCanvas.getContext('2d');
  gctx.imageSmoothingEnabled = false;

  drawCharacter(gctx, traits, rng);

  scaleWithStyle(ctx, gridCanvas, size, traits.pixelStyle);

  return { canvas, gridCanvas, traits };
}

// ─── Trait Resolution ───────────────────────────────────────────────────────

function resolvePaletteDef(rng: SeededRandom, override?: string): PaletteDef {
  if (override && override !== 'random') {
    const found = COLOR_PALETTES.find(p => p.value.name === override);
    if (found) return found.value;
  }
  return rng.pickWeighted(COLOR_PALETTES);
}

function resolveColorAssignment(rng: SeededRandom, palDef: PaletteDef): ColorPalette {
  const sorted = [...palDef.colors].sort((a, b) => luminance(a) - luminance(b));
  const bg = sorted[0];
  const rest = sorted.slice(1);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const n = rest.length;
  const pick = (i: number) => rest[i % n];
  const skin = pick(0);
  return {
    name: palDef.name,
    bg,
    skin,
    skinShadow: darken(skin, 30),
    eyes: pick(1),
    mouth: pick(2),
    hair: pick(3),
    accent: pick(4),
  };
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function resolveWeighted<T>(
  rng: SeededRandom,
  items: readonly { value: T; weight: number }[],
  override?: string,
): T {
  if (override && override !== 'random') {
    const found = items.find(i => String(i.value) === override);
    if (found) return found.value;
    return override as unknown as T;
  }
  if (items.length === 0) return '' as unknown as T;
  return rng.pickWeighted(items);
}

// ─── Main Draw ──────────────────────────────────────────────────────────────

function drawCharacter(ctx: CanvasRenderingContext2D, traits: FaceTraits, rng: SeededRandom): void {
  const { palette } = traits;

  drawBackground(ctx, traits.bgPattern, palette, rng);
  drawClothing(ctx, traits.clothing, palette, rng);
  drawNeck(ctx, palette);
  drawFaceShape(ctx, traits.faceShape, palette, rng);
  drawEyes(ctx, traits.eyeType, palette, rng);
  drawMouth(ctx, traits.mouthStyle, palette, rng);
  drawHair(ctx, traits.hairStyle, palette, rng);
  drawAccessory(ctx, traits.accessory, palette, rng);
}

// ─── Shape Drawing (registry-backed) ────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, pattern: BgPattern, pal: ColorPalette, rng: SeededRandom): void {
  rect(ctx, 0, 0, GRID, GRID, pal.bg);
  const def = getShapeDef('background', pattern);
  if (def) def.draw(ctx, pal, rng);
}

function drawNeck(ctx: CanvasRenderingContext2D, pal: ColorPalette): void {
  rect(ctx, 13, 21, 6, 3, pal.skin);
  vline(ctx, 13, 22, 2, pal.skinShadow);
  vline(ctx, 18, 22, 2, pal.skinShadow);
}

function drawFaceShape(ctx: CanvasRenderingContext2D, shape: FaceShape, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('face', shape);
  if (def) def.draw(ctx, pal, rng);
}

function drawHair(ctx: CanvasRenderingContext2D, style: HairStyle, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('hair', style);
  if (def) def.draw(ctx, pal, rng);
}

function drawEyes(ctx: CanvasRenderingContext2D, eyeType: EyeType, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('eyes', eyeType);
  if (def) def.draw(ctx, pal, rng);
}

function drawMouth(ctx: CanvasRenderingContext2D, style: MouthStyle, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('mouth', style);
  if (def) def.draw(ctx, pal, rng);
}

function drawClothing(ctx: CanvasRenderingContext2D, type: ClothingType, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('clothing', type);
  if (def) def.draw(ctx, pal, rng);
}

function drawAccessory(ctx: CanvasRenderingContext2D, acc: Accessory, pal: ColorPalette, rng: SeededRandom): void {
  const def = getShapeDef('accessory', acc);
  if (def) def.draw(ctx, pal, rng);
}

// ─── Pixel Style Scaling ────────────────────────────────────────────────────

function scaleWithStyle(
  ctx: CanvasRenderingContext2D,
  gridCanvas: Canvas,
  size: number,
  style: PixelStyle,
): void {
  if (style === 'square') {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gridCanvas as any, 0, 0, size, size);
    return;
  }

  const gctx = gridCanvas.getContext('2d');
  const imageData = gctx.getImageData(0, 0, GRID, GRID);
  const data = imageData.data;
  const cell = size / GRID;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const idx = (gy * GRID + gx) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      if (a === 0) continue;

      const x = gx * cell;
      const y = gy * cell;
      drawStyledCell(ctx, x, y, cell, r, g, b, a);
    }
  }
}

function drawStyledCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cell: number,
  r: number, g: number, b: number, a: number,
): void {
  ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
  const half = cell / 2;
  ctx.beginPath();
  ctx.arc(x + half, y + half, half * 0.55, 0, Math.PI * 2);
  ctx.fill();
}
