import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const neck_bolts: PixelDef = {
  name: 'neck_bolts',
  weight: 3,
  draw(ctx, pal, _rng) {
    rect(ctx, 5, 14, 2, 2, '#888888');
    rect(ctx, 25, 14, 2, 2, '#888888');
    px(ctx, 5, 14, '#aaaaaa'); px(ctx, 26, 14, '#aaaaaa');
  },
};
export default neck_bolts;
