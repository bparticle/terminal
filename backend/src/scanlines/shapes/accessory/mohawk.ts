import type { PixelDef } from '../types';
import { vline } from '../helpers';

const mohawk: PixelDef = {
  name: 'mohawk',
  weight: 4,
  draw(ctx, pal, rng) {
    for (let i = 0; i < 9; i++) {
      const h = rng.int(3, 7);
      vline(ctx, 12 + i, 3 - h, h, pal.accent);
    }
  },
};
export default mohawk;
