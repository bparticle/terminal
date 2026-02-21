import type { PixelDef } from '../types';
import { px, rect, hline, vline } from '../helpers';
import { baseShoulders } from './_base';

const armor: PixelDef = {
  name: 'armor',
  weight: 2,
  draw(ctx, pal, rng) {
    const clothColor = pal.accent;
    const clothDark = pal.accent;
    baseShoulders(ctx, clothColor, clothDark);
    const metal = '#667788';
    const metalDark = '#445566';
    const metalLight = '#88aacc';
    rect(ctx, 0, 27, 32, 5, metal);
    rect(ctx, 2, 26, 28, 1, metal);
    rect(ctx, 4, 25, 24, 1, metal);
    rect(ctx, 10, 24, 12, 1, metal);
    rect(ctx, 0, 25, 6, 6, metalLight);
    rect(ctx, 26, 25, 6, 6, metalLight);
    rect(ctx, 1, 24, 4, 1, metalLight);
    rect(ctx, 27, 24, 4, 1, metalLight);
    hline(ctx, 0, 30, 6, metalDark);
    hline(ctx, 26, 30, 6, metalDark);
    hline(ctx, 12, 23, 8, metalDark);
    rect(ctx, 13, 23, 6, 2, metal);
    vline(ctx, 16, 25, 5, metalDark);
    px(ctx, 8, 26, metalLight); px(ctx, 23, 26, metalLight);
    px(ctx, 8, 29, metalLight); px(ctx, 23, 29, metalLight);
    rng.next();
    hline(ctx, 13, 25, 3, metalLight);
    hline(ctx, 0, 31, 32, metalDark);
  },
};
export default armor;
