import type { PixelDef } from '../types';
import { px, rect, hline, vline } from '../helpers';

const pharaoh: PixelDef = {
  name: 'pharaoh',
  weight: 1,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 0, 18, 5, '#ffd700');
    hline(ctx, 7, 4, 18, '#ccaa00');
    rect(ctx, 4, 5, 3, 12, '#ffd700');
    rect(ctx, 25, 5, 3, 12, '#ffd700');
    vline(ctx, 4, 5, 12, '#ccaa00');
    vline(ctx, 27, 5, 12, '#ccaa00');
    px(ctx, 15, 0, '#44cc44'); px(ctx, 16, 0, '#44cc44');
    px(ctx, 15, -1, '#44cc44'); px(ctx, 16, -1, '#44cc44');
    hline(ctx, 7, 1, 18, '#2244cc');
    hline(ctx, 7, 3, 18, '#2244cc');
  },
};
export default pharaoh;
