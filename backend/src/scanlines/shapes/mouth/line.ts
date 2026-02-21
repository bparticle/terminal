import type { PixelDef } from '../types';
import { hline } from '../helpers';

const line: PixelDef = {
  name: 'line',
  weight: 10,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 4, pal.mouth);
  },
};
export default line;
