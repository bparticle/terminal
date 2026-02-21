import type { PixelDef } from '../types';
import { rect, hline, vline, px, darken } from '../helpers';

const braids: PixelDef = {
  name: 'braids',
  weight: 3,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    // Two braids hanging down from top
    rect(ctx, 8, 0, 16, 5, h);
    hline(ctx, 9, -1, 14, h);
    // Left braid
    for (let y = 5; y < 20; y++) {
      const bx = (y % 2 === 0) ? 5 : 6;
      rect(ctx, bx, y, 2, 1, h);
      if (y % 2 === 0) px(ctx, bx + 1, y, hd);
    }
    // Right braid
    for (let y = 5; y < 20; y++) {
      const bx = (y % 2 === 0) ? 24 : 25;
      rect(ctx, bx, y, 2, 1, h);
      if (y % 2 === 0) px(ctx, bx, y, hd);
    }
    // Braid ties
    px(ctx, 5, 19, pal.accent); px(ctx, 6, 19, pal.accent);
    px(ctx, 24, 19, pal.accent); px(ctx, 25, 19, pal.accent);
    // Slight sides
    vline(ctx, 7, 3, 3, h);
    vline(ctx, 24, 3, 3, h);
  },
};
export default braids;
