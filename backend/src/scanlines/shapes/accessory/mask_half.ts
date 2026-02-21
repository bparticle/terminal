import type { PixelDef } from '../types';
import { rect, vline, hline } from '../helpers';

const mask_half: PixelDef = {
  name: 'mask_half',
  weight: 3,
  draw(ctx, pal, _rng) {
    rect(ctx, 16, 5, 9, 14, '#ffffff');
    rect(ctx, 17, 4, 7, 1, '#ffffff');
    rect(ctx, 19, 10, 3, 2, '#000000');
    vline(ctx, 16, 5, 14, '#dddddd');
    hline(ctx, 17, 18, 7, '#dddddd');
  },
};
export default mask_half;
