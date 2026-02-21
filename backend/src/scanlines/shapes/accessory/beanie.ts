import type { PixelDef } from '../types';
import { rect, hline, darken } from '../helpers';

const beanie: PixelDef = {
  name: 'beanie',
  weight: 6,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 1, 18, 5, pal.accent);
    rect(ctx, 8, 0, 16, 1, pal.accent);
    hline(ctx, 7, 5, 18, darken(pal.accent, 30));
    hline(ctx, 7, 4, 18, darken(pal.accent, 15));
  },
};
export default beanie;
