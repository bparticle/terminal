import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const flat_top: PixelDef = {
  name: 'flat_top',
  weight: 4,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Perfectly flat top edge
    rect(ctx, 7, 0, 18, 5, h);
    // Perfectly flat — no rounding
    hline(ctx, 7, 0, 18, hl);
    // Sides trimmed
    vline(ctx, 7, 4, 5, h);
    vline(ctx, 24, 4, 5, h);
    // Shadow
    hline(ctx, 7, 4, 18, hd);
  },
};
export default flat_top;
