import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const sleepy: PixelDef = {
  name: 'sleepy',
  weight: 6,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    hline(ctx, lx, ly, 3, pal.skinShadow);
    px(ctx, lx, ly + 1, pal.eyes);
    px(ctx, lx + 2, ly + 1, pal.eyes);
    hline(ctx, rx, ly, 3, pal.skinShadow);
    px(ctx, rx, ly + 1, pal.eyes);
    px(ctx, rx + 2, ly + 1, pal.eyes);
  },
};
export default sleepy;
