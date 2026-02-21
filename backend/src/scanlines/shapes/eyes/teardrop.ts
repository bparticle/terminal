import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const teardrop: PixelDef = {
  name: 'teardrop',
  weight: 5,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#000000');
    px(ctx, rx + 1, ly + 1, '#000000');
    px(ctx, lx, ly + 2, '#4488ff');
    px(ctx, lx, ly + 3, '#4488ff');
    px(ctx, lx, ly + 4, '#2266cc');
  },
};
export default teardrop;
