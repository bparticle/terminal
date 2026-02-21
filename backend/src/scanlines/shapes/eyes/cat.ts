import type { PixelDef } from '../types';
import { rect, vline } from '../helpers';

const cat: PixelDef = {
  name: 'cat',
  weight: 6,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly - 1, 3, 3, pal.eyes);
    rect(ctx, rx, ly - 1, 3, 3, pal.eyes);
    vline(ctx, lx + 1, ly - 1, 3, '#000000');
    vline(ctx, rx + 1, ly - 1, 3, '#000000');
  },
};
export default cat;
