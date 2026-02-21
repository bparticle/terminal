import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const round: PixelDef = {
  name: 'round',
  weight: 9,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly - 1, 3, 3, '#ffffff');
    rect(ctx, rx, ly - 1, 3, 3, '#ffffff');
    px(ctx, lx + 1, ly, pal.eyes);
    px(ctx, rx + 1, ly, pal.eyes);
  },
};
export default round;
