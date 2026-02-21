import type { PixelDef } from '../types';
import { hline, vline } from '../helpers';

const monocle: PixelDef = {
  name: 'monocle',
  weight: 4,
  draw(ctx, pal, _rng) {
    hline(ctx, 19, 9, 3, pal.accent); hline(ctx, 19, 13, 3, pal.accent);
    vline(ctx, 18, 10, 3, pal.accent); vline(ctx, 22, 10, 3, pal.accent);
    vline(ctx, 22, 13, 4, pal.accent);
  },
};
export default monocle;
