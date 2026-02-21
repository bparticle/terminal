import type { PixelDef } from '../types';
import { rect, hline, lighten, GRID } from '../helpers';

const laser: PixelDef = {
  name: 'laser',
  weight: 1,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    hline(ctx, 0, ly, lx, pal.eyes);
    hline(ctx, rx + 3, ly, GRID - rx - 3, pal.eyes);
    hline(ctx, 0, ly + 1, lx, lighten(pal.eyes, 40));
    hline(ctx, rx + 3, ly + 1, GRID - rx - 3, lighten(pal.eyes, 40));
  },
};
export default laser;
