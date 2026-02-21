import type { PixelDef } from '../types';
import { px, rect } from '../helpers';

const glasses_visor: PixelDef = {
  name: 'glasses_visor',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 7, 9, 18, 4, pal.accent);
    for (let y = 10; y < 12; y++)
      for (let x = 8; x < 24; x++)
        if ((x + y) % 2 === 0) px(ctx, x, y, pal.skin);
  },
};
export default glasses_visor;
