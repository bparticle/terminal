import type { PixelDef } from '../types';
import { px, rect, hline, vline, darken, lighten } from '../helpers';
import { baseShoulders } from './_base';

const trenchcoat: PixelDef = {
  name: 'trenchcoat',
  weight: 3,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    const clothLight = lighten(clothColor, 15);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    px(ctx, 12, 24, clothLight); px(ctx, 13, 25, clothLight);
    px(ctx, 19, 24, clothLight); px(ctx, 18, 25, clothLight);
    hline(ctx, 6, 28, 20, darken(clothColor, 35));
    px(ctx, 16, 28, '#ccaa66');
    vline(ctx, 16, 24, 4, clothDark);
    px(ctx, 11, 22, clothColor); px(ctx, 20, 22, clothColor);
    px(ctx, 10, 23, clothColor); px(ctx, 21, 23, clothColor);
  },
};
export default trenchcoat;
