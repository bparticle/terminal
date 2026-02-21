import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const oval: PixelDef = {
  name: 'oval',
  weight: 12,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 3, 14, 19, pal.skin);
    rect(ctx, 8, 5, 16, 15, pal.skin);
    hline(ctx, 10, 2, 12, pal.skin);
    hline(ctx, 10, 22, 12, pal.skin);
    hline(ctx, 9, 21, 14, pal.skinShadow);
  },
};
export default oval;
