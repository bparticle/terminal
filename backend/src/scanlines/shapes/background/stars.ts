import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const stars: PixelDef = {
  name: 'stars',
  weight: 3,
  draw(ctx, pal, rng) {
    for (let i = 0; i < 12; i++) {
      const sx = rng.int(0, GRID - 1);
      const sy = rng.int(0, GRID - 1);
      px(ctx, sx, sy, lighten(pal.bg, rng.int(15, 35)));
      if (rng.chance(0.4)) {
        px(ctx, sx + 1, sy, lighten(pal.bg, 8));
        px(ctx, sx, sy + 1, lighten(pal.bg, 8));
      }
    }
  },
};
export default stars;
