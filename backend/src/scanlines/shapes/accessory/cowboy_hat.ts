import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const cowboy_hat: PixelDef = {
  name: 'cowboy_hat',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 10, 0, 12, 3, '#8b6342');
    rect(ctx, 3, 2, 26, 2, '#8b6342');
    hline(ctx, 3, 3, 26, '#6b4a2f');
    rect(ctx, 12, 0, 8, 1, '#7a5838');
    hline(ctx, 10, 2, 12, '#cc9955');
  },
};
export default cowboy_hat;
