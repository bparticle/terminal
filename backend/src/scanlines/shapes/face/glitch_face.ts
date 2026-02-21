import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const glitch_face: PixelDef = {
  name: 'glitch_face',
  weight: 1,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 4, 16, 6, pal.skin);
    rect(ctx, 10, 10, 16, 5, pal.skin);
    rect(ctx, 6, 15, 16, 6, pal.skin);
    hline(ctx, 6, 10, 4, pal.eyes);
    hline(ctx, 22, 15, 4, pal.eyes);
    hline(ctx, 8, 21, 14, pal.skinShadow);
  },
};
export default glitch_face;
