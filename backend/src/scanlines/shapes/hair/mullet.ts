import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const mullet: PixelDef = {
  name: 'mullet',
  weight: 3,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Short on top/front, long in back
    rect(ctx, 8, 2, 16, 3, h);
    hline(ctx, 9, 1, 14, h);
    // Short front bangs
    hline(ctx, 9, 4, 14, h);
    // Party in the back — long trailing down
    rect(ctx, 22, 4, 4, 15, h);
    rect(ctx, 23, 18, 3, 4, h);
    vline(ctx, 25, 20, 3, hd);
    // Slight sideburns
    vline(ctx, 7, 4, 4, h);
    // Highlight
    hline(ctx, 10, 2, 12, hl);
  },
};
export default mullet;
