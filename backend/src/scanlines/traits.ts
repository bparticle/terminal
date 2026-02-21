/**
 * Trait Definitions & Color Palettes (server-side adaptation)
 *
 * Copied from scanlines/src/utils/traits.ts with browser-only
 * helpers removed (dropdown builders, getDefaultOverrides).
 */

// ─── Palette Definition (what the user curates) ─────────────────────────────

export interface PaletteDef {
  name: string;
  colors: string[];
}

// ─── Resolved Color Assignment (what the drawing code uses) ─────────────────

export interface ColorPalette {
  name: string;
  skin: string;
  skinShadow: string;
  eyes: string;
  mouth: string;
  hair: string;
  bg: string;
  accent: string;
}

// ─── Palette Definitions ────────────────────────────────────────────────────

export const COLOR_PALETTES: readonly { value: PaletteDef; weight: number }[] = [
  // ── Common ──
  { weight: 12, value: { name: 'Terminal',    colors: ['#020802', '#0a1f0a', '#1a4a1a', '#22cc44', '#33ff66', '#88ffcc'] } },
  { weight: 12, value: { name: 'Amber',       colors: ['#0a0600', '#2a1808', '#5a3a10', '#cc8822', '#ffaa33', '#ffdd88'] } },
  { weight: 10, value: { name: 'Peach',       colors: ['#1a1218', '#5a3020', '#c49478', '#e8b89a', '#cc5544', '#ffcc88'] } },
  { weight: 10, value: { name: 'Cocoa',       colors: ['#151015', '#2a1a0a', '#6b4a2f', '#8b6342', '#cc6655', '#ffaa77'] } },
  // ── Uncommon ──
  { weight: 8,  value: { name: 'Cyber',       colors: ['#020810', '#0a2040', '#1a5080', '#33aadd', '#33ccff', '#88eeff'] } },
  { weight: 7,  value: { name: 'Neon Pink',   colors: ['#100210', '#3a0a30', '#7a1060', '#cc2288', '#ff44bb', '#ffaadd'] } },
  { weight: 7,  value: { name: 'Porcelain',   colors: ['#12101a', '#4a2818', '#8b4513', '#d4b8a8', '#f0dcd0', '#88aaff'] } },
  { weight: 6,  value: { name: 'Golden',      colors: ['#0a0812', '#3a2208', '#6a3a10', '#b08030', '#d4a44a', '#ffd700'] } },
  { weight: 6,  value: { name: 'Lavender',    colors: ['#0a0812', '#2a1840', '#4a2a5a', '#9480aa', '#b8a0cc', '#ffdd44'] } },
  { weight: 6,  value: { name: 'Olive',       colors: ['#080a05', '#2a3010', '#3a4a1a', '#6a7a40', '#8a9a5a', '#ff6644'] } },
  // ── Rare ──
  { weight: 4,  value: { name: 'Ice',         colors: ['#060a10', '#1a3050', '#405060', '#80a0b8', '#a0c0d8', '#ff4444'] } },
  { weight: 4,  value: { name: 'Coral',       colors: ['#100808', '#3a1818', '#5a3030', '#c06850', '#e08870', '#ffbbaa'] } },
  { weight: 4,  value: { name: 'Rust',        colors: ['#0a0604', '#2a1a0a', '#4a2a10', '#6a3018', '#8a4a2a', '#cc6633'] } },
  { weight: 3,  value: { name: 'Void',        colors: ['#08040f', '#1a0a2a', '#3a1a5a', '#6030aa', '#aa44cc', '#ff44ff'] } },
  { weight: 3,  value: { name: 'Neon Night',  colors: ['#050510', '#1a1a2a', '#2a2a4a', '#00ff88', '#ff0066', '#00ffcc'] } },
  { weight: 3,  value: { name: 'Sakura',      colors: ['#0a0608', '#3a1820', '#8a4060', '#e8a0b8', '#ffc8d8', '#ffffff'] } },
  { weight: 3,  value: { name: 'Toxic',       colors: ['#040804', '#0a2a0a', '#1a4a0a', '#44cc00', '#88ff00', '#ccff44'] } },
  { weight: 3,  value: { name: 'Midnight',    colors: ['#020208', '#0a0a2a', '#1a1a5a', '#3030aa', '#4444ff', '#aaaaff'] } },
  // ── Epic ──
  { weight: 2,  value: { name: 'Ghost',       colors: ['#0a0a0f', '#2a2a35', '#8080b0', '#c0c0d0', '#e8e8f0', '#ff0000'] } },
  { weight: 2,  value: { name: 'Chrome',      colors: ['#080808', '#333338', '#555560', '#888890', '#b0b0b8', '#ccccdd'] } },
  { weight: 2,  value: { name: 'Solar',       colors: ['#0a0400', '#3a1000', '#882200', '#cc6600', '#ffaa00', '#ffff00'] } },
  { weight: 2,  value: { name: 'Blood Moon',  colors: ['#0a0204', '#2a0808', '#5a1010', '#aa2020', '#cc3030', '#ff6666'] } },
  { weight: 2,  value: { name: 'Absinthe',    colors: ['#040a04', '#0a2a0a', '#2a5a1a', '#5aaa3a', '#88dd44', '#ccff88'] } },
  // ── Curated ──
  { weight: 6,  value: { name: 'Pastel EGA',  colors: ['#414141', '#8d8d8d', '#bfbfbf', '#f6f6f6', '#dd4274', '#db7497', '#1db37b', '#70e6ae', '#4c96d7', '#a5d2f3', '#bf2faf', '#df7cd3', '#cbae25', '#faf8ac', '#41bcbc', '#5fe4e4'] } },
  { weight: 5,  value: { name: 'Fizzy 12',    colors: ['#ffae67', '#ff40cc', '#7a18af', '#0e0730', '#5b09f2', '#9962ff', '#ed9eff', '#ccffc1', '#60d946', '#029a80', '#042d5b', '#38e6c8'] } },
  { weight: 3,  value: { name: 'CC 29',       colors: ['#f2f0e5', '#b8b5b9', '#868188', '#646365', '#45444f', '#3a3858', '#212123', '#352b42', '#43436a', '#4b80ca', '#68c2d3', '#a2dcc7', '#ede19e', '#d3a068', '#b45252', '#6a536e', '#4b4158', '#80493a', '#a77b5b', '#e5ceb4', '#c2d368', '#8ab060', '#567b79', '#4e584a', '#7b7243', '#b2b47e', '#edc8c4', '#cf8acb', '#5f556a'] } },
  { weight: 4,  value: { name: 'Vinik 24',    colors: ['#000000', '#6f6776', '#9a9a97', '#c5ccb8', '#8b5580', '#c38890', '#a593a5', '#666092', '#9a4f50', '#c28d75', '#7ca1c0', '#416aa3', '#8d6268', '#be955c', '#68aca9', '#387080', '#6e6962', '#93a167', '#6eaa78', '#557064', '#9d9f7f', '#7e9e99', '#5d6872', '#433455'] } },
  { weight: 3,  value: { name: 'Midnight Ablaze', colors: ['#ff8274', '#d53c6a', '#7c183c', '#460e2b', '#31051e', '#1f0510', '#130208'] } },
  { weight: 2,  value: { name: 'Otterisk 96', colors: ['#2f3b3d', '#464b4f', '#5c6163', '#7b7d77', '#999991', '#b5b2ac', '#d4d0cd', '#ebf0ee', '#57483b', '#6e5f4d', '#8a7b63', '#a3987a', '#bdb395', '#d6d0b0', '#614257', '#7a586a', '#997482', '#b39196', '#c9adab', '#decbbf', '#444a66', '#566178', '#6c8091', '#839ea6', '#99bab5', '#bed4c8', '#5e4452', '#80575b', '#9e7565', '#ba9273', '#d1ae8a', '#5c4644', '#785a55', '#9c756a', '#b89184', '#ccad9b', '#8f3648', '#b04a58', '#cc6764', '#e38674', '#e8a68e', '#ebcbbc', '#8a3c24', '#9e5333', '#bd6f42', '#d48d57', '#e0ac6c', '#e8cd97', '#855c22', '#9e7a36', '#ba9745', '#ccb45c', '#e3d176', '#e6dfa1', '#32571d', '#4b6c2e', '#6d8740', '#8aa355', '#aabd68', '#cfd496', '#255461', '#346c70', '#4d8a7e', '#68a88e', '#8ac290', '#b7d9a9', '#255269', '#336c7a', '#438c91', '#5ba9a4', '#80c2ac', '#abdbb8', '#364996', '#4761ad', '#5782ba', '#709fcf', '#8cbade', '#add6e0', '#46449c', '#5d59b3', '#7c75c9', '#a08fdb', '#c0aae3', '#d6caeb', '#683b8a', '#864ea6', '#a46abd', '#c385d6', '#d8a3e3', '#e8c5e6', '#85347a', '#a8487f', '#c4668c', '#db84a1', '#e6a3af', '#ebc7ca'] } },
  // ── Legendary ──
  { weight: 1,  value: { name: 'Glitch',      colors: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'] } },
  { weight: 1,  value: { name: 'Monochrome',  colors: ['#080808', '#222222', '#555555', '#888888', '#bbbbbb', '#eeeeee'] } },
  { weight: 1,  value: { name: 'Infrared',    colors: ['#0a0000', '#330000', '#880000', '#cc0044', '#ff0088', '#ff44cc'] } },
  { weight: 1,  value: { name: 'Hologram',    colors: ['#080818', '#1a1a4a', '#44aacc', '#88ffcc', '#ff88ff', '#ffffff'] } },
];

// ─── Shape Type Aliases ─────────────────────────────────────────────────────

export type FaceShape = string;
export type EyeType = string;
export type MouthStyle = string;
export type HairStyle = string;
export type Accessory = string;
export type ClothingType = string;
export type BgPattern = string;

// ─── Shape Weighted Arrays (derived from registry) ──────────────────────────

import {
  FACE_SHAPE_DEFS, EYE_TYPE_DEFS, MOUTH_STYLE_DEFS,
  HAIR_STYLE_DEFS, ACCESSORY_DEFS, CLOTHING_TYPE_DEFS, BG_PATTERN_DEFS,
} from './shapes/registry';

export const FACE_SHAPES:    readonly { value: string; weight: number }[] = FACE_SHAPE_DEFS;
export const EYE_TYPES:      readonly { value: string; weight: number }[] = EYE_TYPE_DEFS;
export const MOUTH_STYLES:   readonly { value: string; weight: number }[] = MOUTH_STYLE_DEFS;
export const HAIR_STYLES:    readonly { value: string; weight: number }[] = HAIR_STYLE_DEFS;
export const ACCESSORIES:    readonly { value: string; weight: number }[] = ACCESSORY_DEFS;
export const CLOTHING_TYPES: readonly { value: string; weight: number }[] = CLOTHING_TYPE_DEFS;
export const BG_PATTERNS:    readonly { value: string; weight: number }[] = BG_PATTERN_DEFS;

// ─── Pixel Styles ──────────────────────────────────────────────────────────

export type PixelStyle = 'square' | 'dot_matrix';

export const PIXEL_STYLES: readonly { value: PixelStyle; weight: number }[] = [
  { value: 'square',        weight: 50 },
  { value: 'dot_matrix',    weight: 1 },
];

// ─── Generated Face Traits ──────────────────────────────────────────────────

export interface FaceTraits {
  seed: number;
  palette: ColorPalette;
  paletteName: string;
  faceShape: string;
  hairStyle: string;
  eyeType: string;
  mouthStyle: string;
  accessory: string;
  clothing: string;
  bgPattern: string;
  pixelStyle: PixelStyle;
}

// ─── Trait Overrides (for GUI control) ──────────────────────────────────────

export interface TraitOverrides {
  palette: string;
  faceShape: string;
  hairStyle: string;
  eyeType: string;
  mouthStyle: string;
  accessory: string;
  clothing: string;
  bgPattern: string;
  pixelStyle: string;
}
