import type { PixelDef } from '../types';
import { rect, hline } from '../helpers';

const pilot_goggles: PixelDef = {
  name: 'pilot_goggles',
  weight: 4,
  draw(ctx, pal, _rng) {
    rect(ctx, 8, 3, 6, 3, '#886644');
    rect(ctx, 18, 3, 6, 3, '#886644');
    rect(ctx, 9, 4, 4, 1, '#88ccff');
    rect(ctx, 19, 4, 4, 1, '#88ccff');
    hline(ctx, 14, 4, 4, '#775533');
    hline(ctx, 5, 4, 3, '#664422');
    hline(ctx, 24, 4, 3, '#664422');
  },
};
export default pilot_goggles;
