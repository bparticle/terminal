import type { PixelDef } from '../types';
import { px } from '../helpers';

const dot: PixelDef = {
  name: 'dot',
  weight: 5,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    px(ctx, lx + 1, ly, pal.eyes);
    px(ctx, rx + 1, ly, pal.eyes);
  },
};
export default dot;
