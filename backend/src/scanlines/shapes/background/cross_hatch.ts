import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const cross_hatch: PixelDef = {
  name: 'cross_hatch',
  weight: 5,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if ((x + y) % 4 === 0 || (x - y + GRID) % 4 === 0)
          px(ctx, x, y, lighten(pal.bg, 8));
  },
};
export default cross_hatch;
