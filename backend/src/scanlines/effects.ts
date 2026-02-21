/**
 * CRT/Scanline Effects Library
 *
 * All effects operate directly on pixel data arrays (Uint8ClampedArray)
 * for maximum performance. Each effect reads from a source and writes
 * to a destination (or modifies in place).
 */

import type { EffectParams } from './effect-types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get the index into a pixel array for (x, y) at given width */
function idx(x: number, y: number, w: number): number {
  return (y * w + x) * 4;
}

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// ─── Pixelation ─────────────────────────────────────────────────────────────

export function applyPixelation(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  blockSize: number,
): void {
  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      let r = 0, g = 0, b = 0, count = 0;
      const endY = Math.min(by + blockSize, h);
      const endX = Math.min(bx + blockSize, w);

      // Average the block
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = idx(x, y, w);
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          count++;
        }
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      // Fill the block
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = idx(x, y, w);
          pixels[i] = r;
          pixels[i + 1] = g;
          pixels[i + 2] = b;
        }
      }
    }
  }
}

// ─── Horizontal Scanlines ───────────────────────────────────────────────────

export function applyScanlines(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  thickness: number,
  spacing: number,
  opacity: number,
): void {
  const period = thickness + spacing;
  const darken = 1 - opacity;

  for (let y = 0; y < h; y++) {
    const posInPeriod = y % period;
    if (posInPeriod < thickness) {
      // This is a scanline row — darken it
      for (let x = 0; x < w; x++) {
        const i = idx(x, y, w);
        pixels[i] = Math.round(pixels[i] * darken);
        pixels[i + 1] = Math.round(pixels[i + 1] * darken);
        pixels[i + 2] = Math.round(pixels[i + 2] * darken);
      }
    }
  }
}

// ─── RGB Separation ─────────────────────────────────────────────────────────

export function applyRGBSeparation(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  offset: number,
): void {
  if (offset === 0) return;

  // We need a copy of the original to read from
  const src = new Uint8ClampedArray(pixels);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y, w);

      // Red channel — shift left
      const rx = clamp(x - offset, 0, w - 1);
      pixels[i] = src[idx(rx, y, w)];

      // Green channel — keep in place
      pixels[i + 1] = src[i + 1];

      // Blue channel — shift right
      const bx = clamp(x + offset, 0, w - 1);
      pixels[i + 2] = src[idx(bx, y, w) + 2];
    }
  }
}

// ─── Chromatic Aberration (radial) ──────────────────────────────────────────

export function applyChromaticAberration(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  strength: number,
): void {
  if (strength === 0) return;

  const src = new Uint8ClampedArray(pixels);
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y, w);
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const shift = Math.round(strength * dist);

      if (shift === 0) {
        continue;
      }

      const dirX = dx === 0 && dy === 0 ? 0 : dx / Math.sqrt(dx * dx + dy * dy);

      // Red — shift outward
      const rx = clamp(Math.round(x + dirX * shift), 0, w - 1);
      pixels[i] = src[idx(rx, y, w)];

      // Blue — shift inward
      const bx = clamp(Math.round(x - dirX * shift), 0, w - 1);
      pixels[i + 2] = src[idx(bx, y, w) + 2];
    }
  }
}

// ─── Screen Curvature (Barrel Distortion) ───────────────────────────────────

export function applyCurvature(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  strength: number,
): void {
  if (strength === 0) return;

  const src = new Uint8ClampedArray(pixels);
  const cx = w / 2;
  const cy = h / 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Normalize to [-1, 1]
      const nx = (x - cx) / cx;
      const ny = (y - cy) / cy;

      // Barrel distortion
      const r2 = nx * nx + ny * ny;
      const distortion = 1 + strength * r2;

      const srcX = cx + nx * distortion * cx;
      const srcY = cy + ny * distortion * cy;

      const i = idx(x, y, w);

      if (srcX < 0 || srcX >= w || srcY < 0 || srcY >= h) {
        // Outside bounds — black
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 255;
      } else {
        // Nearest-neighbor sampling
        const sx = Math.round(srcX);
        const sy = Math.round(srcY);
        const si = idx(clamp(sx, 0, w - 1), clamp(sy, 0, h - 1), w);
        pixels[i] = src[si];
        pixels[i + 1] = src[si + 1];
        pixels[i + 2] = src[si + 2];
        pixels[i + 3] = src[si + 3];
      }
    }
  }
}

// ─── Phosphor Glow ──────────────────────────────────────────────────────────

export function applyPhosphorGlow(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number,
  threshold: number,
): void {
  // Step 1: Extract bright areas
  const bright = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    if (brightness > threshold) {
      bright[i] = pixels[i];
      bright[i + 1] = pixels[i + 1];
      bright[i + 2] = pixels[i + 2];
      bright[i + 3] = 255;
    }
  }

  // Step 2: Box blur the bright areas (horizontal then vertical)
  const temp = new Uint8ClampedArray(bright.length);
  boxBlurH(bright, temp, w, h, radius);
  boxBlurV(temp, bright, w, h, radius);

  // Step 3: Additive blend
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = clamp(pixels[i] + Math.round(bright[i] * 0.5), 0, 255);
    pixels[i + 1] = clamp(pixels[i + 1] + Math.round(bright[i + 1] * 0.5), 0, 255);
    pixels[i + 2] = clamp(pixels[i + 2] + Math.round(bright[i + 2] * 0.5), 0, 255);
  }
}

function boxBlurH(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): void {
  const diam = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    let ri = 0, gi = 0, bi = 0;

    // Seed the accumulator
    for (let x = -r; x <= r; x++) {
      const cx = clamp(x, 0, w - 1);
      const i = idx(cx, y, w);
      ri += src[i];
      gi += src[i + 1];
      bi += src[i + 2];
    }

    for (let x = 0; x < w; x++) {
      const i = idx(x, y, w);
      dst[i] = Math.round(ri / diam);
      dst[i + 1] = Math.round(gi / diam);
      dst[i + 2] = Math.round(bi / diam);
      dst[i + 3] = 255;

      // Slide the window
      const addX = clamp(x + r + 1, 0, w - 1);
      const remX = clamp(x - r, 0, w - 1);
      const ai = idx(addX, y, w);
      const rmi = idx(remX, y, w);
      ri += src[ai] - src[rmi];
      gi += src[ai + 1] - src[rmi + 1];
      bi += src[ai + 2] - src[rmi + 2];
    }
  }
}

function boxBlurV(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): void {
  const diam = r * 2 + 1;
  for (let x = 0; x < w; x++) {
    let ri = 0, gi = 0, bi = 0;

    for (let y = -r; y <= r; y++) {
      const cy = clamp(y, 0, h - 1);
      const i = idx(x, cy, w);
      ri += src[i];
      gi += src[i + 1];
      bi += src[i + 2];
    }

    for (let y = 0; y < h; y++) {
      const i = idx(x, y, w);
      dst[i] = Math.round(ri / diam);
      dst[i + 1] = Math.round(gi / diam);
      dst[i + 2] = Math.round(bi / diam);
      dst[i + 3] = 255;

      const addY = clamp(y + r + 1, 0, h - 1);
      const remY = clamp(y - r, 0, h - 1);
      const ai = idx(x, addY, w);
      const rmi = idx(x, remY, w);
      ri += src[ai] - src[rmi];
      gi += src[ai + 1] - src[rmi + 1];
      bi += src[ai + 2] - src[rmi + 2];
    }
  }
}

// ─── Vignette ───────────────────────────────────────────────────────────────

export function applyVignette(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  strength: number,
  radius: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Smooth falloff starting at `radius` distance
      const vignette = 1 - strength * clamp((dist - radius) / (1.5 - radius), 0, 1);
      const factor = clamp(vignette, 0, 1);

      const i = idx(x, y, w);
      pixels[i] = Math.round(pixels[i] * factor);
      pixels[i + 1] = Math.round(pixels[i + 1] * factor);
      pixels[i + 2] = Math.round(pixels[i + 2] * factor);
    }
  }
}

// ─── Static / Noise ─────────────────────────────────────────────────────────

export function applyNoise(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
): void {
  const intensity = amount * 255;

  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    pixels[i] = clamp(pixels[i] + noise, 0, 255);
    pixels[i + 1] = clamp(pixels[i + 1] + noise, 0, 255);
    pixels[i + 2] = clamp(pixels[i + 2] + noise, 0, 255);
  }
}

// ─── Color Bleeding ─────────────────────────────────────────────────────────

export function applyColorBleeding(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
): void {
  if (amount === 0) return;

  const r = Math.round(amount);
  const src = new Uint8ClampedArray(pixels);

  // Horizontal box blur on R and B channels only (simulates CRT color smearing)
  const diam = r * 2 + 1;

  for (let y = 0; y < h; y++) {
    let ri = 0, bi = 0;

    for (let x = -r; x <= r; x++) {
      const cx = clamp(x, 0, w - 1);
      const i = idx(cx, y, w);
      ri += src[i];
      bi += src[i + 2];
    }

    for (let x = 0; x < w; x++) {
      const i = idx(x, y, w);
      pixels[i] = Math.round(ri / diam);
      // Green stays sharp
      pixels[i + 2] = Math.round(bi / diam);

      const addX = clamp(x + r + 1, 0, w - 1);
      const remX = clamp(x - r, 0, w - 1);
      ri += src[idx(addX, y, w)] - src[idx(remX, y, w)];
      bi += src[idx(addX, y, w) + 2] - src[idx(remX, y, w) + 2];
    }
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

/**
 * Applies the full CRT effects pipeline to a canvas ImageData.
 * Effects are applied in a fixed order for consistent results.
 */
export function applyEffectsPipeline(
  imageData: ImageData,
  params: EffectParams,
): void {
  const { data, width, height } = imageData;

  if (params.pixelation.enabled) {
    applyPixelation(data, width, height, params.pixelation.blockSize);
  }
  if (params.colorBleeding.enabled) {
    applyColorBleeding(data, width, height, params.colorBleeding.amount);
  }
  if (params.rgbSeparation.enabled) {
    applyRGBSeparation(data, width, height, params.rgbSeparation.offset);
  }
  if (params.chromaticAberration.enabled) {
    applyChromaticAberration(data, width, height, params.chromaticAberration.strength);
  }
  if (params.scanlines.enabled) {
    applyScanlines(
      data, width, height,
      params.scanlines.thickness,
      params.scanlines.spacing,
      params.scanlines.opacity,
    );
  }
  if (params.phosphorGlow.enabled) {
    applyPhosphorGlow(data, width, height, params.phosphorGlow.radius, params.phosphorGlow.threshold);
  }
  if (params.noise.enabled) {
    applyNoise(data, width, height, params.noise.amount);
  }
  if (params.vignette.enabled) {
    applyVignette(data, width, height, params.vignette.strength, params.vignette.radius);
  }
  if (params.curvature.enabled) {
    applyCurvature(data, width, height, params.curvature.strength);
  }
}
