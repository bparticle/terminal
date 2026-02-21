import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const heart: PixelDef = {
  name: 'heart',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    px(ctx, lx, ly, pal.eyes); px(ctx, lx + 2, ly, pal.eyes);
    hline(ctx, lx, ly + 1, 3, pal.eyes);
    px(ctx, lx + 1, ly + 2, pal.eyes);
    px(ctx, rx, ly, pal.eyes); px(ctx, rx + 2, ly, pal.eyes);
    hline(ctx, rx, ly + 1, 3, pal.eyes);
    px(ctx, rx + 1, ly + 2, pal.eyes);
  },
};
export default heart;
