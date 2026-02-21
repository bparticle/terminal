import type { PixelDef } from '../types';
import { rect, hline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const turtleneck: PixelDef = {
  name: 'turtleneck',
  weight: 6,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 12, 20, 8, 5, clothColor);
    rect(ctx, 11, 22, 10, 3, clothColor);
    hline(ctx, 12, 21, 8, clothDark);
    hline(ctx, 12, 23, 8, clothLight);
  },
};
export default turtleneck;
