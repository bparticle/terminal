import type { PixelDef } from '../types';
import { hline } from '../helpers';

const neutral: PixelDef = {
  name: 'neutral',
  weight: 14,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx, my, 6, pal.mouth);
  },
};
export default neutral;
