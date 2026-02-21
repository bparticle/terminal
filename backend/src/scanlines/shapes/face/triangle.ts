import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const triangle: PixelDef = {
  name: 'triangle',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 5, 3, 22, 4, pal.skin);
    rect(ctx, 6, 7, 20, 4, pal.skin);
    rect(ctx, 7, 11, 18, 3, pal.skin);
    rect(ctx, 9, 14, 14, 3, pal.skin);
    rect(ctx, 11, 17, 10, 3, pal.skin);
    rect(ctx, 13, 20, 6, 2, pal.skin);
    hline(ctx, 13, 21, 6, pal.skinShadow);
    hline(ctx, 6, 2, 20, pal.skin);
  },
};
export default triangle;
