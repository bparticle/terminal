import type { PixelDef } from '../types';
import { hline, vline } from '../helpers';

const glasses_round: PixelDef = {
  name: 'glasses_round',
  weight: 7,
  draw(ctx, pal, _rng) {
    hline(ctx, 10, 9, 3, pal.accent); hline(ctx, 10, 13, 3, pal.accent);
    vline(ctx, 9, 10, 3, pal.accent); vline(ctx, 13, 10, 3, pal.accent);
    hline(ctx, 19, 9, 3, pal.accent); hline(ctx, 19, 13, 3, pal.accent);
    vline(ctx, 18, 10, 3, pal.accent); vline(ctx, 22, 10, 3, pal.accent);
    hline(ctx, 14, 11, 4, pal.accent);
  },
};
export default glasses_round;
