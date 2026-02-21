import type { PixelDef } from '../types';
import { px, hline, vline } from '../helpers';

const war_paint: PixelDef = {
  name: 'war_paint',
  weight: 5,
  draw(ctx, pal, _rng) {
    const wp = pal.accent;
    hline(ctx, 9, 13, 4, wp);
    hline(ctx, 19, 13, 4, wp);
    hline(ctx, 8, 14, 5, wp);
    hline(ctx, 19, 14, 5, wp);
    px(ctx, 16, 5, wp); px(ctx, 15, 6, wp); px(ctx, 17, 6, wp);
    vline(ctx, 16, 19, 3, wp);
  },
};
export default war_paint;
