import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const round: PixelDef = {
  name: 'round',
  weight: 12,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 4, 16, 17, pal.skin);
    rect(ctx, 7, 6, 18, 13, pal.skin);
    hline(ctx, 9, 3, 14, pal.skin);
    hline(ctx, 9, 21, 14, pal.skin);
    rect(ctx, 7, 17, 1, 2, pal.skinShadow);
    rect(ctx, 24, 17, 1, 2, pal.skinShadow);
    hline(ctx, 8, 21, 16, pal.skinShadow);
  },
};
export default round;
