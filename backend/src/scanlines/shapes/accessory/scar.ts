import type { PixelDef } from '../types';
import { px } from '../helpers';

const scar: PixelDef = {
  name: 'scar',
  weight: 5,
  draw(ctx, pal, _rng) {
    px(ctx, 10, 8, '#cc4444'); px(ctx, 11, 9, '#cc4444');
    px(ctx, 11, 10, '#cc4444'); px(ctx, 12, 11, '#cc4444');
    px(ctx, 12, 12, '#cc4444'); px(ctx, 13, 13, '#cc4444');
  },
};
export default scar;
