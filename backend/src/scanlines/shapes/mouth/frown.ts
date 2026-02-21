import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const frown: PixelDef = {
  name: 'frown',
  weight: 7,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 4, pal.mouth);
    px(ctx, mx, my + 1, pal.mouth);
    px(ctx, mx + 5, my + 1, pal.mouth);
  },
};
export default frown;
