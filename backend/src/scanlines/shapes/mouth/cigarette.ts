import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const cigarette: PixelDef = {
  name: 'cigarette',
  weight: 3,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 4, pal.mouth);
    hline(ctx, mx + 5, my, 4, '#e8d8c0');
    px(ctx, mx + 5, my, '#ddcc99');
    px(ctx, mx + 8, my, '#ff6600');
    px(ctx, mx + 9, my - 1, '#88888844');
    px(ctx, mx + 8, my - 2, '#88888833');
    px(ctx, mx + 10, my - 2, '#88888822');
  },
};
export default cigarette;
