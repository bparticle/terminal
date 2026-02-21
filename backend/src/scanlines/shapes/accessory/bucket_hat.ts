import type { PixelDef } from '../types';
import { rect, hline, darken } from '../helpers';

const bucket_hat: PixelDef = {
  name: 'bucket_hat',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 0, 14, 4, pal.accent);
    rect(ctx, 5, 3, 22, 2, pal.accent);
    hline(ctx, 5, 4, 22, darken(pal.accent, 20));
    hline(ctx, 9, 2, 14, darken(pal.accent, 10));
  },
};
export default bucket_hat;
