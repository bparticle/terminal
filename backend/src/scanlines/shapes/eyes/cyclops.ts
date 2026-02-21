import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const cyclops: PixelDef = {
  name: 'cyclops',
  weight: 2,
  draw(ctx, pal, _rng) {
    const ly = 11;
    rect(ctx, 13, ly - 1, 6, 4, '#ffffff');
    rect(ctx, 14, ly - 1, 4, 4, pal.eyes);
    rect(ctx, 15, ly, 2, 2, '#000000');
    hline(ctx, 13, ly - 2, 6, pal.skinShadow);
  },
};
export default cyclops;
