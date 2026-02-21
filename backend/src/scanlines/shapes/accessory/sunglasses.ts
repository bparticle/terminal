import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const sunglasses: PixelDef = {
  name: 'sunglasses',
  weight: 6,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 10, 5, 3, '#111111');
    rect(ctx, 18, 10, 5, 3, '#111111');
    hline(ctx, 14, 11, 4, '#111111');
    px(ctx, 10, 10, '#333333'); px(ctx, 19, 10, '#333333');
    hline(ctx, 5, 11, 4, '#222222');
    hline(ctx, 23, 11, 4, '#222222');
  },
};
export default sunglasses;
