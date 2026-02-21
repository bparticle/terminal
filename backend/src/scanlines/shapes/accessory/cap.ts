import type { PixelDef } from '../types';
import { rect, darken } from '../helpers';

const cap: PixelDef = {
  name: 'cap',
  weight: 6,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 1, 18, 4, pal.accent);
    rect(ctx, 5, 4, 22, 1, pal.accent);
    rect(ctx, 3, 5, 13, 1, darken(pal.accent, 20));
  },
};
export default cap;
