import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const bomber: PixelDef = {
  name: 'bomber',
  weight: 6,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    hline(ctx, 11, 23, 10, clothDark);
    hline(ctx, 11, 24, 10, clothColor);
    vline(ctx, 16, 24, 8, clothDark);
    hline(ctx, 0, 28, 4, clothDark);
    hline(ctx, 28, 28, 4, clothDark);
    rect(ctx, 2, 26, 3, 2, clothLight);
    rect(ctx, 27, 26, 3, 2, clothLight);
  },
};
export default bomber;
