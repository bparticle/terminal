import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const medium: PixelDef = {
  name: 'medium',
  weight: 12,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Fuller hair coverage on top, comes down to ears
    rect(ctx, 8, 1, 16, 5, h);
    hline(ctx, 9, 0, 14, h);
    // Sides framing face
    rect(ctx, 6, 3, 2, 9, h);
    rect(ctx, 24, 3, 2, 9, h);
    // Volume highlight
    hline(ctx, 10, 1, 12, hl);
    // Shadow under mass
    hline(ctx, 8, 5, 16, hd);
    vline(ctx, 6, 10, 2, hd);
    vline(ctx, 25, 10, 2, hd);
  },
};
export default medium;
