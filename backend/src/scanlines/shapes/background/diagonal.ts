import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const diagonal: PixelDef = {
  name: 'diagonal',
  weight: 5,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if ((x + y) % 3 === 0) px(ctx, x, y, lighten(pal.bg, 10));
  },
};
export default diagonal;
