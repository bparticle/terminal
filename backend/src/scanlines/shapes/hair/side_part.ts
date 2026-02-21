import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const side_part: PixelDef = {
  name: 'side_part',
  weight: 10,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Parted to the left — heavier on right side
    rect(ctx, 8, 1, 16, 5, h);
    hline(ctx, 9, 0, 14, h);
    // Part line (gap) at x=12
    vline(ctx, 12, 1, 3, pal.skin);
    // Left side thinner
    vline(ctx, 7, 4, 5, h);
    // Right side fuller
    rect(ctx, 24, 3, 2, 7, h);
    rect(ctx, 13, 1, 11, 5, h); // heavier right mass
    // Highlight on the fuller side
    hline(ctx, 14, 1, 9, hl);
    hline(ctx, 8, 5, 16, hd);
  },
};
export default side_part;
