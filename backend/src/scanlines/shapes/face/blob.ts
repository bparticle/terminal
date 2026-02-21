import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const blob: PixelDef = {
  name: 'blob',
  weight: 3,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 5, 17, 15, pal.skin);
    rect(ctx, 9, 3, 14, 2, pal.skin);
    rect(ctx, 6, 7, 2, 10, pal.skin);
    rect(ctx, 24, 6, 2, 8, pal.skin);
    rect(ctx, 5, 9, 2, 5, pal.skin);
    rect(ctx, 25, 8, 1, 6, pal.skin);
    rect(ctx, 8, 20, 15, 2, pal.skin);
    px(ctx, 10, 22, pal.skin);
    hline(ctx, 9, 21, 13, pal.skinShadow);
    px(ctx, 5, 13, pal.skinShadow);
  },
};
export default blob;
