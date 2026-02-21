import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';
import { baseShoulders } from './_base';

const cape: PixelDef = {
  name: 'cape',
  weight: 3,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    rect(ctx, 0, 25, 5, 7, clothDark);
    rect(ctx, 27, 25, 5, 7, clothDark);
    rect(ctx, 0, 27, 3, 5, darken(clothColor, 40));
    rect(ctx, 29, 27, 3, 5, darken(clothColor, 40));
    px(ctx, 14, 23, '#ffd700'); px(ctx, 17, 23, '#ffd700');
    hline(ctx, 14, 22, 4, '#ffd700');
    px(ctx, 11, 22, clothDark); px(ctx, 12, 21, clothDark);
    px(ctx, 20, 22, clothDark); px(ctx, 19, 21, clothDark);
  },
};
export default cape;
