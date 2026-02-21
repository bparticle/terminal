import type { PixelDef } from '../types';
import { px, rect, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const suit: PixelDef = {
  name: 'suit',
  weight: 4,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 14, 23, 4, 3, '#ffffff');
    px(ctx, 15, 23, '#ffffff'); px(ctx, 16, 23, '#ffffff');
    px(ctx, 12, 24, clothLight); px(ctx, 13, 25, clothLight);
    px(ctx, 19, 24, clothLight); px(ctx, 18, 25, clothLight);
    px(ctx, 16, 27, clothDark);
    px(ctx, 16, 29, clothDark);
    px(ctx, 15, 25, '#cc3333'); px(ctx, 16, 25, '#cc3333');
    px(ctx, 15, 26, '#cc3333'); px(ctx, 16, 26, '#aa2222');
    vline(ctx, 15, 27, 3, '#cc3333');
  },
};
export default suit;
