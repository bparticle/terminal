import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const long_straight: PixelDef = {
  name: 'long_straight',
  weight: 6,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Long flowing straight hair down both sides
    rect(ctx, 8, 0, 16, 5, h);
    hline(ctx, 9, -1, 14, h);
    // Left flowing down
    rect(ctx, 5, 3, 3, 18, h);
    vline(ctx, 5, 19, 3, hd);
    // Right flowing down
    rect(ctx, 24, 3, 3, 18, h);
    vline(ctx, 26, 19, 3, hd);
    // Top highlight
    hline(ctx, 10, 0, 12, hl);
    // Shadow
    hline(ctx, 8, 4, 16, hd);
  },
};
export default long_straight;
