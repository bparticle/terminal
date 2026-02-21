import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const waves: PixelDef = {
  name: 'waves',
  weight: 3,
  draw(ctx, pal, _rng) {
    for (let y = 0; y < GRID; y += 4) {
      for (let x = 0; x < GRID; x++) {
        const wy = y + Math.round(Math.sin(x * 0.5) * 1.5);
        if (wy >= 0 && wy < GRID) px(ctx, x, wy, lighten(pal.bg, 12));
      }
    }
  },
};
export default waves;
