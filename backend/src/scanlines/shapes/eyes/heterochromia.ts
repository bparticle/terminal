import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const heterochromia: PixelDef = {
  name: 'heterochromia',
  weight: 2,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#000000');
    rect(ctx, rx, ly, 3, 2, pal.accent);
    px(ctx, rx + 1, ly + 1, '#000000');
  },
};
export default heterochromia;
