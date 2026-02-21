import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const narrow: PixelDef = {
  name: 'narrow',
  weight: 8,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    hline(ctx, lx, ly + 1, 3, pal.eyes);
    hline(ctx, rx, ly + 1, 3, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#ffffff');
    px(ctx, rx + 1, ly + 1, '#ffffff');
  },
};
export default narrow;
