import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const glasses_square: PixelDef = {
  name: 'glasses_square',
  weight: 6,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 9, 5, 5, pal.accent); rect(ctx, 10, 10, 3, 3, pal.skin);
    rect(ctx, 18, 9, 5, 5, pal.accent); rect(ctx, 19, 10, 3, 3, pal.skin);
    hline(ctx, 14, 11, 4, pal.accent);
  },
};
export default glasses_square;
