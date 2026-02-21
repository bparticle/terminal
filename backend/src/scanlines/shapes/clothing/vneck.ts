import type { PixelDef } from '../types';
import { px, darken } from '../helpers';
import { baseShoulders } from './_base';

const vneck: PixelDef = {
  name: 'vneck',
  weight: 7,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    px(ctx, 15, 23, pal.skin); px(ctx, 16, 23, pal.skin);
    px(ctx, 14, 24, pal.skin); px(ctx, 15, 24, pal.skin);
    px(ctx, 16, 24, pal.skin); px(ctx, 17, 24, pal.skin);
    px(ctx, 13, 25, pal.skin); px(ctx, 14, 25, pal.skin);
    px(ctx, 17, 25, pal.skin); px(ctx, 18, 25, pal.skin);
    px(ctx, 15, 25, pal.skin); px(ctx, 16, 25, pal.skin);
    px(ctx, 14, 26, pal.skin); px(ctx, 17, 26, pal.skin);
    px(ctx, 13, 24, clothDark); px(ctx, 18, 24, clothDark);
    px(ctx, 12, 25, clothDark); px(ctx, 19, 25, clothDark);
    px(ctx, 13, 26, clothDark); px(ctx, 18, 26, clothDark);
  },
};
export default vneck;
