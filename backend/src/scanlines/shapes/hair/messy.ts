import type { PixelDef } from '../types';
import { rect, hline, vline, px, darken, lighten } from '../helpers';

const messy: PixelDef = {
  name: 'messy',
  weight: 7,
  draw(ctx, pal, rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Messy/tousled — irregular clumps
    rect(ctx, 8, 1, 16, 5, h);
    hline(ctx, 9, 0, 14, h);
    // Random protruding bits
    for (let i = 0; i < 10; i++) {
      const mx = rng.int(7, 25);
      const my = rng.int(-2, 2);
      const mh = rng.int(1, 3);
      vline(ctx, mx, my, mh, h);
    }
    // Messy sideburns
    for (let y = 4; y < 10; y++) {
      if (rng.chance(0.6)) px(ctx, 6, y, h);
      if (rng.chance(0.6)) px(ctx, 7, y, h);
      if (rng.chance(0.6)) px(ctx, 24, y, h);
      if (rng.chance(0.6)) px(ctx, 25, y, h);
    }
    // Texture
    for (let y = 0; y < 5; y++)
      for (let x = 8; x < 24; x++)
        if (rng.chance(0.2)) px(ctx, x, y, rng.chance(0.5) ? hl : hd);
  },
};
export default messy;
