import type { PixelDef } from '../types';
import { GRID, hline, lerpColor, lighten } from '../helpers';

const gradient_v: PixelDef = {
  name: 'gradient_v',
  weight: 10,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y++)
      hline(ctx, 0, y, GRID, lerpColor(pal.bg, lighten(pal.bg, 30), y / GRID));
  },
};
export default gradient_v;
