import type { PixelDef } from '../types';
import { px } from '../helpers';

const glitch: PixelDef = {
  name: 'glitch',
  weight: 3,
  draw(ctx, pal, rng) {
    const ly = 11, lx = 11, rx = 19;
    for (let i = 0; i < 8; i++) {
      px(ctx, lx + rng.int(-1, 3), ly + rng.int(-1, 2), pal.eyes);
      px(ctx, rx + rng.int(-1, 3), ly + rng.int(-1, 2), pal.eyes);
    }
  },
};
export default glitch;
