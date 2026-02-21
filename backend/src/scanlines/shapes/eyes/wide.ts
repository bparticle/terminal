import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const wide: PixelDef = {
  name: 'wide',
  weight: 9,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx - 1, ly, 4, 3, '#ffffff');
    rect(ctx, rx, ly, 4, 3, '#ffffff');
    rect(ctx, lx, ly, 2, 3, pal.eyes);
    rect(ctx, rx + 1, ly, 2, 3, pal.eyes);
    px(ctx, lx, ly + 1, '#000000');
    px(ctx, rx + 2, ly + 1, '#000000');
  },
};
export default wide;
