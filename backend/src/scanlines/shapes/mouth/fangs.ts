import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const fangs: PixelDef = {
  name: 'fangs',
  weight: 4,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx, my, 6, pal.mouth);
    px(ctx, mx + 1, my + 1, '#ffffff'); px(ctx, mx + 4, my + 1, '#ffffff');
    px(ctx, mx + 1, my + 2, '#ffffff'); px(ctx, mx + 4, my + 2, '#ffffff');
  },
};
export default fangs;
