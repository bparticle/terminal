import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const dots: PixelDef = {
  name: 'dots',
  weight: 6,
  draw(ctx, pal, _rng) {
    for (let y = 1; y < GRID; y += 3)
      for (let x = 1; x < GRID; x += 3) px(ctx, x, y, lighten(pal.bg, 12));
  },
};
export default dots;
