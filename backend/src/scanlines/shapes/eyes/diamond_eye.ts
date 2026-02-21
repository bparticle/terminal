import type { PixelDef } from '../types';
import { px } from '../helpers';

const diamond_eye: PixelDef = {
  name: 'diamond_eye',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    px(ctx, lx + 1, ly - 1, pal.eyes);
    px(ctx, lx, ly, pal.eyes); px(ctx, lx + 2, ly, pal.eyes);
    px(ctx, lx + 1, ly + 1, pal.eyes);
    px(ctx, lx + 1, ly, '#000000');
    px(ctx, rx + 1, ly - 1, pal.eyes);
    px(ctx, rx, ly, pal.eyes); px(ctx, rx + 2, ly, pal.eyes);
    px(ctx, rx + 1, ly + 1, pal.eyes);
    px(ctx, rx + 1, ly, '#000000');
  },
};
export default diamond_eye;
