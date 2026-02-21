import type { PixelDef } from '../types';
import { px } from '../helpers';

const star: PixelDef = {
  name: 'star',
  weight: 3,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    const pts = [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]];
    for (const [dx, dy] of pts) {
      px(ctx, lx + dx, ly + dy - 1, pal.eyes);
      px(ctx, rx + dx, ly + dy - 1, pal.eyes);
    }
  },
};
export default star;
