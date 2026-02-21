import type { PixelDef } from '../types';
import { px, rect, hline, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const hoodie: PixelDef = {
  name: 'hoodie',
  weight: 9,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 11, 23, 10, 2, clothColor);
    rect(ctx, 13, 23, 6, 1, pal.skin);
    hline(ctx, 11, 24, 10, clothDark);
    rect(ctx, 12, 28, 8, 2, clothDark);
    vline(ctx, 14, 24, 3, clothLight);
    vline(ctx, 17, 24, 3, clothLight);
  },
};
export default hoodie;
