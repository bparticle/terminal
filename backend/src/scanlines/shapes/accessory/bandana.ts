import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';

const bandana: PixelDef = {
  name: 'bandana',
  weight: 5,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 3, 18, 3, pal.accent);
    hline(ctx, 7, 5, 18, darken(pal.accent, 20));
    px(ctx, 25, 4, pal.accent); px(ctx, 26, 5, pal.accent);
    px(ctx, 25, 6, pal.accent); px(ctx, 26, 4, darken(pal.accent, 15));
  },
};
export default bandana;
