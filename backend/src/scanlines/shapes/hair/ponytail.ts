import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const ponytail: PixelDef = {
  name: 'ponytail',
  weight: 5,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Pulled back with a tail hanging behind (right side)
    rect(ctx, 8, 1, 16, 4, h);
    hline(ctx, 9, 0, 14, h);
    // Pulled-back look — thinner on sides
    vline(ctx, 7, 3, 3, h);
    vline(ctx, 24, 3, 3, h);
    // Ponytail extending right
    rect(ctx, 24, 1, 3, 3, h);
    rect(ctx, 26, 3, 2, 3, h);
    rect(ctx, 27, 5, 2, 4, h);
    vline(ctx, 28, 8, 4, h);
    vline(ctx, 27, 10, 3, hd);
    // Hair band
    hline(ctx, 24, 2, 3, pal.accent);
    // Highlight
    hline(ctx, 10, 1, 12, hl);
  },
};
export default ponytail;
