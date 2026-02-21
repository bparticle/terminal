import type { PixelDef } from '../types';
import { GRID, vline, lighten } from '../helpers';

const scanlines_v: PixelDef = {
  name: 'scanlines_v',
  weight: 7,
  draw(ctx, pal, _rng) {
    for (let x = 0; x < GRID; x += 2) vline(ctx, x, 0, GRID, lighten(pal.bg, 15));
  },
};
export default scanlines_v;
