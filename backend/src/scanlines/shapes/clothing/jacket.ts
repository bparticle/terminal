import type { PixelDef } from '../types';
import { px, rect, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const jacket: PixelDef = {
  name: 'jacket',
  weight: 7,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    vline(ctx, 16, 24, 8, clothDark);
    px(ctx, 14, 25, clothLight); px(ctx, 15, 25, clothLight);
    px(ctx, 17, 25, clothLight); px(ctx, 18, 25, clothLight);
    px(ctx, 15, 26, clothLight); px(ctx, 17, 26, clothLight);
    px(ctx, 12, 23, clothColor); px(ctx, 19, 23, clothColor);
    px(ctx, 11, 24, clothColor); px(ctx, 20, 24, clothColor);
  },
};
export default jacket;
