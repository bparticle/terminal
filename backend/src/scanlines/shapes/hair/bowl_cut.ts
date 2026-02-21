import type { PixelDef } from '../types';
import { rect, hline, darken, lighten } from '../helpers';

const bowl_cut: PixelDef = {
  name: 'bowl_cut',
  weight: 4,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Classic bowl cut — straight horizontal fringe
    rect(ctx, 7, 1, 18, 5, h);
    hline(ctx, 8, 0, 16, h);
    // Straight fringe at eye-brow level
    rect(ctx, 7, 5, 18, 3, h);
    hline(ctx, 7, 7, 18, hd); // sharp cut line
    // Sides
    rect(ctx, 6, 3, 2, 6, h);
    rect(ctx, 24, 3, 2, 6, h);
    // Highlight band
    hline(ctx, 8, 2, 16, hl);
  },
};
export default bowl_cut;
