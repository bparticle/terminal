import type { PixelDef } from '../types';
import { px, rect, hline, darken } from '../helpers';

const crown: PixelDef = {
  name: 'crown',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 1, 16, 3, '#ffd700');
    rect(ctx, 9, 0, 2, 1, '#ffd700');
    rect(ctx, 15, 0, 2, 1, '#ffd700');
    rect(ctx, 21, 0, 2, 1, '#ffd700');
    px(ctx, 10, 2, '#ff0044'); px(ctx, 16, 2, '#0044ff'); px(ctx, 22, 2, '#00ff44');
    hline(ctx, 8, 3, 16, darken('#ffd700', 30));
  },
};
export default crown;
