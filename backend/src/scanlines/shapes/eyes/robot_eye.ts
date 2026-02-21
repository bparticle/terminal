import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const robot_eye: PixelDef = {
  name: 'robot_eye',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    rect(ctx, lx - 1, ly - 1, 5, 4, '#333333');
    rect(ctx, lx, ly, 3, 2, pal.eyes);
    px(ctx, lx + 1, ly, '#ffffff');
    rect(ctx, rx - 1, ly - 1, 5, 4, '#333333');
    rect(ctx, rx, ly, 3, 2, pal.eyes);
    px(ctx, rx + 1, ly, '#ffffff');
    px(ctx, lx + 1, ly - 1, pal.eyes);
    px(ctx, lx + 1, ly + 2, pal.eyes);
    px(ctx, rx + 1, ly - 1, pal.eyes);
    px(ctx, rx + 1, ly + 2, pal.eyes);
  },
};
export default robot_eye;
