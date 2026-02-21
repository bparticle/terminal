import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';

const wizard_hat: PixelDef = {
  name: 'wizard_hat',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 2, 18, 3, pal.accent);
    rect(ctx, 5, 4, 22, 1, pal.accent);
    rect(ctx, 10, 0, 12, 2, pal.accent);
    rect(ctx, 12, -2, 8, 2, pal.accent);
    rect(ctx, 14, -4, 4, 2, pal.accent);
    px(ctx, 15, -5, pal.accent); px(ctx, 16, -5, pal.accent);
    px(ctx, 14, 1, '#ffd700');
    hline(ctx, 5, 4, 22, darken(pal.accent, 25));
  },
};
export default wizard_hat;
