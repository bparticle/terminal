import type { PixelDef } from '../types';
import { rect, hline, px, darken, lighten } from '../helpers';

const curly: PixelDef = {
  name: 'curly',
  weight: 7,
  draw(ctx, pal, rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Curly/textured hair — thicker mass with texture
    rect(ctx, 7, 0, 18, 6, h);
    hline(ctx, 9, -1, 14, h);
    // Curly sides
    rect(ctx, 5, 2, 3, 10, h);
    rect(ctx, 24, 2, 3, 10, h);
    // Texture — random lighter/darker pixels
    for (let y = -1; y < 6; y++)
      for (let x = 7; x < 25; x++)
        if (rng.chance(0.3)) px(ctx, x, y, rng.chance(0.5) ? hl : hd);
    for (let y = 2; y < 12; y++) {
      if (rng.chance(0.4)) px(ctx, 5, y, hl);
      if (rng.chance(0.4)) px(ctx, 7, y, hd);
      if (rng.chance(0.4)) px(ctx, 24, y, hl);
      if (rng.chance(0.4)) px(ctx, 26, y, hd);
    }
  },
};
export default curly;
