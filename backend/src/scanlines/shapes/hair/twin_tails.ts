import type { PixelDef } from '../types';
import { rect, hline, vline, px, darken } from '../helpers';

const twin_tails: PixelDef = {
  name: 'twin_tails',
  weight: 3,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    // Pigtails sticking out from sides
    rect(ctx, 8, 1, 16, 5, h);
    hline(ctx, 9, 0, 14, h);
    // Left pigtail extending outward and down
    rect(ctx, 3, 4, 5, 3, h);
    rect(ctx, 1, 6, 4, 3, h);
    rect(ctx, 0, 8, 3, 5, h);
    vline(ctx, 0, 11, 3, hd);
    // Right pigtail
    rect(ctx, 24, 4, 5, 3, h);
    rect(ctx, 27, 6, 4, 3, h);
    rect(ctx, 29, 8, 3, 5, h);
    vline(ctx, 31, 11, 3, hd);
    // Hair ties
    px(ctx, 5, 5, pal.accent); px(ctx, 5, 6, pal.accent);
    px(ctx, 26, 5, pal.accent); px(ctx, 26, 6, pal.accent);
  },
};
export default twin_tails;
