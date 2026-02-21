import type { PixelDef } from '../types';
import { px, vline } from '../helpers';

const horns: PixelDef = {
  name: 'horns',
  weight: 4,
  draw(ctx, pal, _rng) {
    vline(ctx, 7, 2, 5, pal.accent); vline(ctx, 6, 0, 4, pal.accent); px(ctx, 5, 0, pal.accent);
    vline(ctx, 24, 2, 5, pal.accent); vline(ctx, 25, 0, 4, pal.accent); px(ctx, 26, 0, pal.accent);
  },
};
export default horns;
