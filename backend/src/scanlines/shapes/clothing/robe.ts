import type { PixelDef } from '../types';
import { px, rect, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const robe: PixelDef = {
  name: 'robe',
  weight: 3,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 8, 21, 4, 4, clothColor);
    rect(ctx, 20, 21, 4, 4, clothColor);
    rect(ctx, 10, 20, 3, 2, clothColor);
    rect(ctx, 19, 20, 3, 2, clothColor);
    rect(ctx, 14, 23, 4, 2, pal.skin);
    px(ctx, 13, 24, pal.skin); px(ctx, 18, 24, pal.skin);
    px(ctx, 16, 27, clothLight); px(ctx, 15, 28, clothLight);
    px(ctx, 17, 28, clothLight); px(ctx, 16, 29, clothLight);
    vline(ctx, 10, 27, 5, clothDark);
    vline(ctx, 22, 27, 5, clothDark);
  },
};
export default robe;
