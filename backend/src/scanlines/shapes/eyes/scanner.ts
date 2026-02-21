import type { PixelDef } from '../types';
import { rect, hline, lighten } from '../helpers';

const scanner: PixelDef = {
  name: 'scanner',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    hline(ctx, 7, ly + 1, 18, lighten(pal.eyes, 40));
  },
};
export default scanner;
