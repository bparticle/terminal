import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const chevron: PixelDef = {
  name: 'chevron',
  weight: 3,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y += 4) {
      for (let x = 0; x < GRID; x++) {
        const cy = y + (x < GRID / 2 ? x % 4 : (GRID - 1 - x) % 4);
        if (cy < GRID) px(ctx, x, cy, lighten(pal.bg, 12));
      }
    }
  },
};
export default chevron;
