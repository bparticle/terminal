import type { PixelDef } from '../types';
import { rect, hline, vline } from '../helpers';

const hexagonal: PixelDef = {
  name: 'hexagonal',
  weight: 3,
  draw(ctx, pal, _rng) {
    rect(ctx, 10, 3, 12, 2, pal.skin);
    rect(ctx, 8, 5, 16, 4, pal.skin);
    rect(ctx, 7, 9, 18, 5, pal.skin);
    rect(ctx, 8, 14, 16, 4, pal.skin);
    rect(ctx, 10, 18, 12, 3, pal.skin);
    hline(ctx, 10, 21, 12, pal.skinShadow);
    vline(ctx, 7, 9, 5, pal.skinShadow);
    vline(ctx, 24, 9, 5, pal.skinShadow);
  },
};
export default hexagonal;
