import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const eyepatch: PixelDef = {
  name: 'eyepatch',
  weight: 3,
  draw(ctx, pal, _rng) {
    rect(ctx, 9, 9, 5, 5, '#1a1a1a');
    hline(ctx, 5, 10, 5, '#333333');
    hline(ctx, 14, 10, 12, '#333333');
  },
};
export default eyepatch;
