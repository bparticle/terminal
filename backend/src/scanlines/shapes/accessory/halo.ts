import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const halo: PixelDef = {
  name: 'halo',
  weight: 2,
  draw(ctx, pal, _rng) {
    hline(ctx, 9, 1, 14, pal.accent);
    hline(ctx, 9, 2, 14, pal.accent);
    rect(ctx, 12, 1, 8, 2, pal.bg);
  },
};
export default halo;
