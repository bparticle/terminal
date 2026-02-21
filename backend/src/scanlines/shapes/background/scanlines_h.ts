import type { PixelDef } from '../types';
import { GRID, hline, lighten } from '../helpers';

const scanlines_h: PixelDef = {
  name: 'scanlines_h',
  weight: 12,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y += 2) hline(ctx, 0, y, GRID, lighten(pal.bg, 15));
  },
};
export default scanlines_h;
