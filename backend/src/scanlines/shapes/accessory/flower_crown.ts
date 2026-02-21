import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const flower_crown: PixelDef = {
  name: 'flower_crown',
  weight: 3,
  draw(ctx, pal, _rng) {
    hline(ctx, 8, 2, 16, '#44aa44');
    px(ctx, 9, 1, '#ff6688'); px(ctx, 12, 1, '#ffcc44');
    px(ctx, 15, 1, '#ff88aa'); px(ctx, 18, 1, '#8888ff');
    px(ctx, 21, 1, '#ff6688');
    px(ctx, 10, 2, '#ffcc44'); px(ctx, 14, 2, '#ff88aa');
    px(ctx, 17, 2, '#ffcc44'); px(ctx, 20, 2, '#88ff88');
  },
};
export default flower_crown;
