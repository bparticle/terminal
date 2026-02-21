import type { PixelDef } from '../types';
import { px, vline } from '../helpers';

const devil_horns: PixelDef = {
  name: 'devil_horns',
  weight: 3,
  draw(ctx, pal, _rng) {
    vline(ctx, 8, 1, 4, '#cc2222');
    px(ctx, 7, 0, '#cc2222'); px(ctx, 7, -1, '#cc2222');
    vline(ctx, 23, 1, 4, '#cc2222');
    px(ctx, 24, 0, '#cc2222'); px(ctx, 24, -1, '#cc2222');
    px(ctx, 7, -1, '#aa1111'); px(ctx, 24, -1, '#aa1111');
  },
};
export default devil_horns;
