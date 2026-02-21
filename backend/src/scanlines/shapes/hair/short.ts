import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const short: PixelDef = {
  name: 'short',
  weight: 12,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Close-cropped solid hair on top + short sideburns
    rect(ctx, 8, 2, 16, 3, h);
    hline(ctx, 9, 1, 14, h);
    // Sideburns
    vline(ctx, 7, 4, 5, h);
    vline(ctx, 24, 4, 5, h);
    // Top highlight
    hline(ctx, 10, 2, 12, hl);
    // Shadow at edge
    hline(ctx, 8, 4, 16, hd);
  },
};
export default short;
