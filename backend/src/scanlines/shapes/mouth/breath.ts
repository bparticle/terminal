import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const breath: PixelDef = {
  name: 'breath',
  weight: 2,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 4, pal.mouth);
    px(ctx, mx + 6, my, '#aaccff44');
    px(ctx, mx + 5, my - 1, '#aaccff33');
    px(ctx, mx + 7, my - 1, '#aaccff33');
    px(ctx, mx + 6, my - 2, '#aaccff22');
    px(ctx, mx + 8, my, '#aaccff22');
    px(ctx, mx + 7, my + 1, '#aaccff22');
  },
};
export default breath;
