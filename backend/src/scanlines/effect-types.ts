/**
 * Effect Parameter Types (server-side subset)
 *
 * Copied from scanlines/src/types.ts — only EffectParams and related
 * interfaces needed for the CRT effects pipeline.
 */

export interface PixelationParams {
  enabled: boolean;
  blockSize: number;
}

export interface ScanlineParams {
  enabled: boolean;
  thickness: number;
  spacing: number;
  opacity: number;
}

export interface RGBSeparationParams {
  enabled: boolean;
  offset: number;
}

export interface ChromaticAberrationParams {
  enabled: boolean;
  strength: number;
}

export interface CurvatureParams {
  enabled: boolean;
  strength: number;
}

export interface PhosphorGlowParams {
  enabled: boolean;
  radius: number;
  threshold: number;
}

export interface VignetteParams {
  enabled: boolean;
  strength: number;
  radius: number;
}

export interface NoiseParams {
  enabled: boolean;
  amount: number;
}

export interface ColorBleedingParams {
  enabled: boolean;
  amount: number;
}

export interface EffectParams {
  pixelation: PixelationParams;
  scanlines: ScanlineParams;
  rgbSeparation: RGBSeparationParams;
  chromaticAberration: ChromaticAberrationParams;
  curvature: CurvatureParams;
  phosphorGlow: PhosphorGlowParams;
  vignette: VignetteParams;
  noise: NoiseParams;
  colorBleeding: ColorBleedingParams;
}

/** The canvas preview size. All effect params are authored relative to this. */
export const PREVIEW_SIZE = 512;

export function scaleParamsForResolution(
  params: EffectParams,
  targetResolution: number,
): EffectParams {
  const s = targetResolution / PREVIEW_SIZE;
  if (s === 1) return structuredClone(params);

  return {
    pixelation: {
      enabled: params.pixelation.enabled,
      blockSize: Math.max(2, Math.round(params.pixelation.blockSize * s)),
    },
    scanlines: {
      enabled: params.scanlines.enabled,
      thickness: Math.max(1, Math.round(params.scanlines.thickness * s)),
      spacing: Math.max(1, Math.round(params.scanlines.spacing * s)),
      opacity: params.scanlines.opacity,
    },
    rgbSeparation: {
      enabled: params.rgbSeparation.enabled,
      offset: Math.round(params.rgbSeparation.offset * s),
    },
    chromaticAberration: {
      enabled: params.chromaticAberration.enabled,
      strength: params.chromaticAberration.strength * s,
    },
    curvature: {
      enabled: params.curvature.enabled,
      strength: params.curvature.strength,
    },
    phosphorGlow: {
      enabled: params.phosphorGlow.enabled,
      radius: Math.max(1, Math.round(params.phosphorGlow.radius * s)),
      threshold: params.phosphorGlow.threshold,
    },
    vignette: {
      enabled: params.vignette.enabled,
      strength: params.vignette.strength,
      radius: params.vignette.radius,
    },
    noise: {
      enabled: params.noise.enabled,
      amount: params.noise.amount,
    },
    colorBleeding: {
      enabled: params.colorBleeding.enabled,
      amount: params.colorBleeding.amount * s,
    },
  };
}

export function getDefaultParams(): EffectParams {
  return {
    pixelation: { enabled: false, blockSize: 8 },
    scanlines: { enabled: true, thickness: 2, spacing: 4, opacity: 0.4 },
    rgbSeparation: { enabled: true, offset: 2 },
    chromaticAberration: { enabled: false, strength: 3 },
    curvature: { enabled: true, strength: 0.15 },
    phosphorGlow: { enabled: false, radius: 3, threshold: 180 },
    vignette: { enabled: true, strength: 0.5, radius: 1.0 },
    noise: { enabled: true, amount: 0.08 },
    colorBleeding: { enabled: false, amount: 3 },
  };
}
