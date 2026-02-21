import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const heart: PixelDef = {
  name: 'heart',
  weight: 7,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 5, 8, 7, pal.skin);
    rect(ctx, 17, 5, 8, 7, pal.skin);
    rect(ctx, 7, 10, 18, 6, pal.skin);
    rect(ctx, 8, 16, 16, 3, pal.skin);
    rect(ctx, 9, 19, 14, 2, pal.skin);
    rect(ctx, 11, 21, 10, 1, pal.skin);
    hline(ctx, 11, 21, 10, pal.skinShadow);
  },
};
export default heart;
