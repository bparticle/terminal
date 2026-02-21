/**
 * Shape Definition Types
 *
 * Each shape variant file default-exports a PixelDef describing
 * its name, rarity weight, and drawing function.
 */

import type { ColorPalette } from '../traits';
import type { SeededRandom } from '../random';

export interface PixelDef {
  /** Shape variant name, e.g. 'round', 'normal', 'bald'. Must match the file/export name. */
  name: string;
  /** Rarity weight for weighted random selection (higher = more common). */
  weight: number;
  /** Draw this shape onto a 32x32 canvas context using the given palette and RNG. */
  draw: (ctx: CanvasRenderingContext2D, pal: ColorPalette, rng: SeededRandom) => void;
}
