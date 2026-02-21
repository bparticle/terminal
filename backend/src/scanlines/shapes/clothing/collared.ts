import type { PixelDef } from '../types';
import { px, rect, darken } from '../helpers';
import { baseShoulders } from './_base';

const collared: PixelDef = {
  name: 'collared',
  weight: 6,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    rect(ctx, 11, 22, 3, 3, '#ffffff');
    rect(ctx, 18, 22, 3, 3, '#ffffff');
    px(ctx, 11, 24, clothColor); px(ctx, 20, 24, clothColor);
    px(ctx, 15, 25, clothDark); px(ctx, 16, 25, clothDark);
  },
};
export default collared;
