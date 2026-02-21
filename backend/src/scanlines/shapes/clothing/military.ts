import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';
import { baseShoulders } from './_base';

const military: PixelDef = {
  name: 'military',
  weight: 3,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 0, 27, 32, 5, '#3a4a2a');
    rect(ctx, 2, 26, 28, 1, '#3a4a2a');
    rect(ctx, 4, 25, 24, 1, '#3a4a2a');
    rect(ctx, 10, 24, 12, 1, '#3a4a2a');
    rect(ctx, 13, 23, 6, 2, pal.skin);
    hline(ctx, 11, 23, 10, '#2a3a1a');
    rect(ctx, 10, 27, 4, 2, '#2a3a1a');
    rect(ctx, 18, 27, 4, 2, '#2a3a1a');
    hline(ctx, 10, 27, 4, '#4a5a3a');
    hline(ctx, 18, 27, 4, '#4a5a3a');
    px(ctx, 11, 26, '#ffd700'); px(ctx, 13, 26, '#cc4444');
    px(ctx, 16, 25, '#888866'); px(ctx, 16, 27, '#888866');
    hline(ctx, 0, 31, 32, '#2a3a1a');
  },
};
export default military;
