import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const alien: PixelDef = {
  name: 'alien',
  weight: 4,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx - 1, ly - 1, 5, 4, pal.eyes);
    rect(ctx, rx - 1, ly - 1, 5, 4, pal.eyes);
    px(ctx, lx - 1, ly - 1, pal.skin); px(ctx, lx + 3, ly - 1, pal.skin);
    px(ctx, lx - 1, ly + 2, pal.skin); px(ctx, lx + 3, ly + 2, pal.skin);
    px(ctx, rx - 1, ly - 1, pal.skin); px(ctx, rx + 3, ly - 1, pal.skin);
    px(ctx, rx - 1, ly + 2, pal.skin); px(ctx, rx + 3, ly + 2, pal.skin);
    px(ctx, lx, ly - 1, '#ffffff');
    px(ctx, rx + 2, ly - 1, '#ffffff');
  },
};
export default alien;
