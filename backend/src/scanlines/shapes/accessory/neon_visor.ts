import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const neon_visor: PixelDef = {
  name: 'neon_visor',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 9, 18, 4, '#00ffcc');
    hline(ctx, 8, 10, 16, '#ffffff');
    hline(ctx, 8, 11, 16, '#00ff88');
    hline(ctx, 7, 8, 18, '#333344');
    hline(ctx, 7, 13, 18, '#333344');
  },
};
export default neon_visor;
