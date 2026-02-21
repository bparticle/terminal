import type { PixelDef } from '../types';
import { rect, hline, vline, lighten } from '../helpers';

const emo: PixelDef = {
  name: 'emo',
  weight: 4,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hl = lighten(h, 20);
    // Heavy fringe covering one eye (left side)
    rect(ctx, 7, 0, 18, 6, h);
    hline(ctx, 8, -1, 16, h);
    // Left side: heavy bangs sweeping down over left eye
    rect(ctx, 7, 5, 9, 4, h);
    rect(ctx, 7, 8, 6, 3, h);
    rect(ctx, 7, 10, 4, 2, h);
    // Right side: shorter, swept away
    vline(ctx, 24, 4, 5, h);
    // Highlight streak
    vline(ctx, 11, 1, 8, hl);
  },
};
export default emo;
