import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const hollow: PixelDef = {
  name: 'hollow',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx - 1, ly - 1, 4, 4, '#000000');
    rect(ctx, rx - 1, ly - 1, 4, 4, '#000000');
    px(ctx, lx - 2, ly, pal.skinShadow); px(ctx, lx + 3, ly, pal.skinShadow);
    px(ctx, rx - 2, ly, pal.skinShadow); px(ctx, rx + 3, ly, pal.skinShadow);
  },
};
export default hollow;
