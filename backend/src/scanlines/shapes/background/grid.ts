import type { PixelDef } from '../types';
import { GRID, hline, vline, lighten } from '../helpers';

const grid: PixelDef = {
  name: 'grid',
  weight: 7,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y += 4) hline(ctx, 0, y, GRID, lighten(pal.bg, 10));
    for (let x = 0; x < GRID; x += 4) vline(ctx, x, 0, GRID, lighten(pal.bg, 10));
  },
};
export default grid;
