import type { PixelDef } from '../types';
import { px, rect, hline, vline } from '../helpers';

const skull: PixelDef = {
  name: 'skull',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 3, 16, 12, pal.skin);
    rect(ctx, 7, 5, 18, 8, pal.skin);
    hline(ctx, 9, 2, 14, pal.skin);
    rect(ctx, 7, 14, 3, 4, pal.skinShadow);
    rect(ctx, 22, 14, 3, 4, pal.skinShadow);
    rect(ctx, 10, 14, 12, 5, pal.skin);
    rect(ctx, 11, 19, 10, 2, pal.skin);
    rect(ctx, 12, 21, 8, 1, pal.skin);
    hline(ctx, 12, 21, 8, pal.skinShadow);
    px(ctx, 15, 14, pal.skinShadow);
    px(ctx, 16, 14, pal.skinShadow);
  },
};
export default skull;
