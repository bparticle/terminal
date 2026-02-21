import type { PixelDef } from '../types';
import { hline } from '../helpers';

const open: PixelDef = {
  name: 'open',
  weight: 6,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 4, pal.mouth);
    hline(ctx, mx + 1, my + 1, 4, '#1a0a0a');
    hline(ctx, mx + 1, my + 2, 4, pal.mouth);
  },
};
export default open;
