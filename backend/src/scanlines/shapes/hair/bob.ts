import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const bob: PixelDef = {
  name: 'bob',
  weight: 6,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Rounded bob cut at jaw level
    rect(ctx, 7, 0, 18, 6, h);
    hline(ctx, 8, -1, 16, h);
    // Sides coming down to jaw
    rect(ctx, 5, 3, 3, 14, h);
    rect(ctx, 24, 3, 3, 14, h);
    // Rounded bottom
    rect(ctx, 6, 16, 2, 2, h);
    rect(ctx, 24, 16, 2, 2, h);
    hline(ctx, 6, 17, 2, hd);
    hline(ctx, 24, 17, 2, hd);
    // Inner shadow
    vline(ctx, 7, 6, 10, hd);
    vline(ctx, 24, 6, 10, hd);
    // Top highlight
    hline(ctx, 9, 0, 14, hl);
  },
};
export default bob;
