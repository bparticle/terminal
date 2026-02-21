import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const wink: PixelDef = {
  name: 'wink',
  weight: 5,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#000000');
    hline(ctx, rx, ly + 1, 3, pal.eyes);
  },
};
export default wink;
