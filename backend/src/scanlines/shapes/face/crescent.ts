import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const crescent: PixelDef = {
  name: 'crescent',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 10, 4, 14, 17, pal.skin);
    rect(ctx, 9, 6, 1, 12, pal.skin);
    hline(ctx, 11, 3, 12, pal.skin);
    rect(ctx, 10, 8, 2, 6, pal.bg);
    px(ctx, 12, 9, pal.bg);
    rect(ctx, 24, 7, 1, 10, pal.skin);
    hline(ctx, 11, 21, 13, pal.skinShadow);
  },
};
export default crescent;
