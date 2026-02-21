import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const normal: PixelDef = {
  name: 'normal',
  weight: 14,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#000000');
    px(ctx, rx + 1, ly + 1, '#000000');
  },
};
export default normal;
