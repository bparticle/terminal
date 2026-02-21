import type { PixelDef } from '../types';
import { hline } from '../helpers';

const teeth: PixelDef = {
  name: 'teeth',
  weight: 5,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx, my, 6, pal.mouth);
    hline(ctx, mx + 1, my + 1, 4, '#ffffff');
    hline(ctx, mx, my + 2, 6, pal.mouth);
  },
};
export default teeth;
