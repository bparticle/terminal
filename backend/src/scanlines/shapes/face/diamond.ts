import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const diamond: PixelDef = {
  name: 'diamond',
  weight: 6,
  draw(ctx, pal, _rng) {
    rect(ctx, 10, 3, 12, 2, pal.skin);
    rect(ctx, 9, 5, 14, 3, pal.skin);
    rect(ctx, 8, 8, 16, 4, pal.skin);
    rect(ctx, 7, 11, 18, 3, pal.skin);
    rect(ctx, 8, 14, 16, 3, pal.skin);
    rect(ctx, 9, 17, 14, 3, pal.skin);
    rect(ctx, 10, 20, 12, 2, pal.skin);
    hline(ctx, 10, 21, 12, pal.skinShadow);
  },
};
export default diamond;
