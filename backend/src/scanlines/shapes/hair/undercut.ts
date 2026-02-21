import type { PixelDef } from '../types';
import { rect, hline, px, darken, lighten } from '../helpers';

const undercut: PixelDef = {
  name: 'undercut',
  weight: 5,
  draw(ctx, pal, rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Shaved sides with longer top swept to the right
    // Top mass only, no sides
    rect(ctx, 8, 0, 16, 5, h);
    hline(ctx, 9, -1, 14, h);
    // Swept right — hair extends further right
    rect(ctx, 22, 1, 4, 4, h);
    px(ctx, 25, 2, h); px(ctx, 25, 3, h);
    // Shaved sides — short stubble
    for (let y = 4; y < 9; y++) {
      if (rng.chance(0.3)) px(ctx, 7, y, hd);
      if (rng.chance(0.3)) px(ctx, 24, y, hd);
    }
    // Highlight
    hline(ctx, 10, 0, 12, hl);
    hline(ctx, 8, 4, 16, hd);
  },
};
export default undercut;
