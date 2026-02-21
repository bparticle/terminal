import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const void_: PixelDef = {
  name: 'void',
  weight: 4,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx - 1, ly - 1, 4, 4, '#000000');
    rect(ctx, rx - 1, ly - 1, 4, 4, '#000000');
    px(ctx, lx, ly - 1, pal.eyes);
    px(ctx, rx + 2, ly - 1, pal.eyes);
  },
};
export default void_;
