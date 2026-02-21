import type { PixelDef } from '../types';
import { rect, vline, hline } from '../helpers';

const angular: PixelDef = {
  name: 'angular',
  weight: 5,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 4, 16, 17, pal.skin);
    vline(ctx, 7, 6, 11, pal.skin);
    vline(ctx, 24, 6, 11, pal.skin);
    hline(ctx, 9, 21, 14, pal.skin);
    hline(ctx, 10, 22, 12, pal.skin);
    hline(ctx, 10, 22, 12, pal.skinShadow);
  },
};
export default angular;
