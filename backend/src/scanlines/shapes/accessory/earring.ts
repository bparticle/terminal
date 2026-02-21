import type { PixelDef } from '../types';
import { px } from '../helpers';

const earring: PixelDef = {
  name: 'earring',
  weight: 5,
  draw(ctx, pal, _rng) {
    px(ctx, 6, 13, pal.accent); px(ctx, 6, 14, pal.accent); px(ctx, 5, 14, pal.accent);
  },
};
export default earring;
