import type { PixelDef } from '../types';
import { px, rect, hline, vline } from '../helpers';

const viking_helm: PixelDef = {
  name: 'viking_helm',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 1, 16, 4, '#777788');
    hline(ctx, 8, 4, 16, '#555566');
    vline(ctx, 16, 4, 4, '#666677');
    vline(ctx, 6, -1, 4, '#e8d8b0'); px(ctx, 5, -2, '#e8d8b0'); px(ctx, 4, -3, '#e8d8b0');
    vline(ctx, 25, -1, 4, '#e8d8b0'); px(ctx, 26, -2, '#e8d8b0'); px(ctx, 27, -3, '#e8d8b0');
    px(ctx, 10, 2, '#aaaaaa'); px(ctx, 22, 2, '#aaaaaa');
  },
};
export default viking_helm;
