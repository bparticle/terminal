import type { PixelDef } from '../types';
import { rect, hline, darken, lighten } from '../helpers';

const long_wavy: PixelDef = {
  name: 'long_wavy',
  weight: 5,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);

    rect(ctx, 8, 0, 16, 5, h);
    hline(ctx, 9, -1, 14, h);
    // Left side — wavy
    for (let y = 3; y < 21; y++) {
      const off = (y % 4 < 2) ? 0 : 1;
      rect(ctx, 5 + off, y, 3, 1, h);
    }
    // Right side — wavy
    for (let y = 3; y < 21; y++) {
      const off = (y % 4 < 2) ? 0 : -1;
      rect(ctx, 24 + off, y, 3, 1, h);
    }
    // Highlight
    hline(ctx, 10, 0, 12, hl);
    hline(ctx, 8, 4, 16, hd);
  },
};
export default long_wavy;
