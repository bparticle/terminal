/**
 * Shape Registry (Node.js — static barrel imports)
 *
 * Replaces the Vite import.meta.glob version with static imports
 * from each category's barrel index.ts file.
 */

import type { PixelDef } from './types';

// Import from existing barrel index.ts files
import * as faceModules from './face';
import * as eyeModules from './eyes';
import * as mouthModules from './mouth';
import * as hairModules from './hair';
import * as accessoryModules from './accessory';
import * as clothingModules from './clothing';
import * as backgroundModules from './background';

// ─── Internal Types ─────────────────────────────────────────────────────────

type ShapeMap = Record<string, PixelDef>;

// ─── Build shape maps (synchronous) ─────────────────────────────────────────

function buildMap(modules: Record<string, unknown>): ShapeMap {
  const map: ShapeMap = {};
  for (const mod of Object.values(modules)) {
    const def = mod as PixelDef;
    if (def?.name && typeof def.draw === 'function') {
      map[def.name] = def;
    }
  }
  return map;
}

const CATEGORIES: Record<string, ShapeMap> = {
  face:       buildMap(faceModules),
  eyes:       buildMap(eyeModules),
  mouth:      buildMap(mouthModules),
  hair:       buildMap(hairModules),
  accessory:  buildMap(accessoryModules),
  clothing:   buildMap(clothingModules),
  background: buildMap(backgroundModules),
};

// ─── Lookup ─────────────────────────────────────────────────────────────────

/** Look up a shape definition by category and variant name. */
export function getShapeDef(category: string, name: string): PixelDef | undefined {
  return CATEGORIES[category]?.[name];
}

/** Get all shape definitions for a category. */
export function getShapeDefs(category: string): PixelDef[] {
  const map = CATEGORIES[category];
  return map ? Object.values(map) : [];
}

// ─── Derived Weighted Arrays ────────────────────────────────────────────────

function toWeightedArray(map: ShapeMap): readonly { value: string; weight: number }[] {
  return Object.values(map).map(s => ({ value: s.name, weight: s.weight }));
}

export const FACE_SHAPE_DEFS    = toWeightedArray(CATEGORIES.face);
export const EYE_TYPE_DEFS      = toWeightedArray(CATEGORIES.eyes);
export const MOUTH_STYLE_DEFS   = toWeightedArray(CATEGORIES.mouth);
export const HAIR_STYLE_DEFS    = toWeightedArray(CATEGORIES.hair);
export const ACCESSORY_DEFS     = toWeightedArray(CATEGORIES.accessory);
export const CLOTHING_TYPE_DEFS = toWeightedArray(CATEGORIES.clothing);
export const BG_PATTERN_DEFS    = toWeightedArray(CATEGORIES.background);
