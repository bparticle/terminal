import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';
import { baseShoulders } from './_base';

const crewneck: PixelDef = {
  name: 'crewneck',
  weight: 10,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    px(ctx, 12, 24, pal.skin);
    px(ctx, 19, 24, pal.skin);
    hline(ctx, 12, 23, 8, clothDark);
  },
};
export default crewneck;
