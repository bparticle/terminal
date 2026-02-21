import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';
import { baseShoulders } from './_base';

const chains: PixelDef = {
  name: 'chains',
  weight: 3,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    const cc = '#ccccaa';
    const cd = '#999977';
    hline(ctx, 10, 24, 12, cc);
    px(ctx, 9, 25, cc); px(ctx, 22, 25, cc);
    hline(ctx, 9, 26, 14, cd);
    hline(ctx, 12, 25, 8, cc);
    px(ctx, 11, 26, cc); px(ctx, 20, 26, cc);
    px(ctx, 16, 27, '#ffd700');
    px(ctx, 15, 28, '#ffd700'); px(ctx, 17, 28, '#ffd700');
    px(ctx, 16, 28, '#ffaa00');
  },
};
export default chains;
