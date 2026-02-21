import type { PixelDef } from '../types';
import { px, rect, hline, vline } from '../helpers';

const shield: PixelDef = {
  name: 'shield',
  weight: 5,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 4, 18, 12, pal.skin);
    rect(ctx, 8, 16, 16, 3, pal.skin);
    rect(ctx, 10, 19, 12, 2, pal.skin);
    rect(ctx, 13, 21, 6, 1, pal.skin);
    px(ctx, 15, 22, pal.skin);
    px(ctx, 16, 22, pal.skin);
    hline(ctx, 7, 3, 18, pal.skin);
    px(ctx, 15, 22, pal.skinShadow);
    px(ctx, 16, 22, pal.skinShadow);
    vline(ctx, 7, 4, 12, pal.skinShadow);
    vline(ctx, 24, 4, 12, pal.skinShadow);
  },
};
export default shield;
