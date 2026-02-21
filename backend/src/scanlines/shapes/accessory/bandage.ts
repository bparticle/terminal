import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const bandage: PixelDef = {
  name: 'bandage',
  weight: 3,
  draw(ctx, pal, _rng) {
    hline(ctx, 7, 5, 18, '#d8ccb0');
    hline(ctx, 7, 7, 18, '#d8ccb0');
    hline(ctx, 7, 9, 18, '#e8dcc0');
    px(ctx, 12, 6, '#d8ccb0'); px(ctx, 20, 6, '#d8ccb0');
    px(ctx, 10, 8, '#d8ccb0'); px(ctx, 22, 8, '#d8ccb0');
    rect(ctx, 18, 10, 4, 3, pal.skin);
  },
};
export default bandage;
