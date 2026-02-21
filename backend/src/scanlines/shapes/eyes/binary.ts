import type { PixelDef } from '../types';
import { px, hline, vline } from '../helpers';

const binary: PixelDef = {
  name: 'binary',
  weight: 2,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    hline(ctx, lx, ly - 1, 3, pal.eyes);
    hline(ctx, lx, ly + 2, 3, pal.eyes);
    vline(ctx, lx, ly, 2, pal.eyes); vline(ctx, lx + 2, ly, 2, pal.eyes);
    vline(ctx, rx + 1, ly - 1, 4, pal.eyes);
    px(ctx, rx, ly - 1, pal.eyes);
    hline(ctx, rx, ly + 2, 3, pal.eyes);
  },
};
export default binary;
