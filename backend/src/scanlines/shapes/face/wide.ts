import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const wide: PixelDef = {
  name: 'wide',
  weight: 7,
  draw(ctx, pal, _rng) {
    rect(ctx, 5, 6, 22, 14, pal.skin);
    hline(ctx, 6, 5, 20, pal.skin);
    hline(ctx, 6, 20, 20, pal.skin);
    hline(ctx, 5, 20, 22, pal.skinShadow);
  },
};
export default wide;
