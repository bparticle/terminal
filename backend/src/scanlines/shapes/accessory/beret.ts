import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';

const beret: PixelDef = {
  name: 'beret',
  weight: 5,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 1, 16, 3, pal.accent);
    rect(ctx, 5, 1, 5, 3, pal.accent);
    rect(ctx, 6, 0, 4, 1, pal.accent);
    hline(ctx, 8, 3, 16, darken(pal.accent, 15));
    px(ctx, 15, 0, darken(pal.accent, 20));
  },
};
export default beret;
