import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const visor_eye: PixelDef = {
  name: 'visor_eye',
  weight: 2,
  draw(ctx, pal, _rng) {
    const ly = 11;
    rect(ctx, 7, ly - 1, 18, 4, pal.eyes);
    hline(ctx, 8, ly + 1, 16, '#000000');
    hline(ctx, 7, ly - 2, 18, pal.hair);
    hline(ctx, 7, ly + 3, 18, pal.hair);
  },
};
export default visor_eye;
