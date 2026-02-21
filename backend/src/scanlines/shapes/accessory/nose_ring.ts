import type { PixelDef } from '../types';
import { px } from '../helpers';

const nose_ring: PixelDef = {
  name: 'nose_ring',
  weight: 5,
  draw(ctx, pal, _rng) {
    px(ctx, 16, 15, pal.accent);
    px(ctx, 17, 15, pal.accent);
    px(ctx, 17, 16, pal.accent);
  },
};
export default nose_ring;
