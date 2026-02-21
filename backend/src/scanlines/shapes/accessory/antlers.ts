import type { PixelDef } from '../types';
import { px, vline } from '../helpers';

const antlers: PixelDef = {
  name: 'antlers',
  weight: 3,
  draw(ctx, pal, _rng) {
    vline(ctx, 8, -2, 7, '#c8a870');
    px(ctx, 7, -2, '#c8a870'); px(ctx, 6, -3, '#c8a870');
    px(ctx, 9, 0, '#c8a870'); px(ctx, 10, -1, '#c8a870');
    vline(ctx, 23, -2, 7, '#c8a870');
    px(ctx, 24, -2, '#c8a870'); px(ctx, 25, -3, '#c8a870');
    px(ctx, 22, 0, '#c8a870'); px(ctx, 21, -1, '#c8a870');
  },
};
export default antlers;
