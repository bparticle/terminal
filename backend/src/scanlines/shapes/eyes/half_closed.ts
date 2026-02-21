import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const half_closed: PixelDef = {
  name: 'half_closed',
  weight: 8,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    hline(ctx, lx, ly - 1, 3, pal.skinShadow);
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly + 1, '#000000');
    hline(ctx, rx, ly - 1, 3, pal.skinShadow);
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    px(ctx, rx + 1, ly + 1, '#000000');
    hline(ctx, lx, ly, 3, pal.skin);
    hline(ctx, rx, ly, 3, pal.skin);
  },
};
export default half_closed;
