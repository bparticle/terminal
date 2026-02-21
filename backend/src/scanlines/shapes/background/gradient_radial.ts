import type { PixelDef } from '../types';
import { GRID, px, lighten } from '../helpers';

const gradient_radial: PixelDef = {
  name: 'gradient_radial',
  weight: 6,
  draw(ctx, pal, _rng) {
    const cx = GRID / 2, cy = GRID / 2;
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (GRID / 2);
        if (d < 0.8) px(ctx, x, y, lighten(pal.bg, Math.round(20 * (1 - d))));
      }
  },
};
export default gradient_radial;
