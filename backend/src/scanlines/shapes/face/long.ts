import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const long: PixelDef = {
  name: 'long',
  weight: 7,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 2, 14, 20, pal.skin);
    rect(ctx, 8, 4, 16, 16, pal.skin);
    hline(ctx, 8, 21, 16, pal.skinShadow);
  },
};
export default long;
