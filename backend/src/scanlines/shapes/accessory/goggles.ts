import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const goggles: PixelDef = {
  name: 'goggles',
  weight: 5,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 5, 5, 3, '#886633');
    rect(ctx, 18, 5, 5, 3, '#886633');
    rect(ctx, 10, 6, 3, 1, '#aaddff');
    rect(ctx, 19, 6, 3, 1, '#aaddff');
    hline(ctx, 14, 6, 4, '#886633');
    hline(ctx, 5, 6, 4, '#664422');
    hline(ctx, 23, 6, 4, '#664422');
  },
};
export default goggles;
