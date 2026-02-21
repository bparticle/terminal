import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const static_pattern: PixelDef = {
  name: 'static',
  weight: 4,
  draw(ctx, pal, rng) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if (rng.chance(0.15)) px(ctx, x, y, lighten(pal.bg, rng.int(5, 25)));
  },
};
export default static_pattern;
