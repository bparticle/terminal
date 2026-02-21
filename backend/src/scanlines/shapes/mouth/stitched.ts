import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const stitched: PixelDef = {
  name: 'stitched',
  weight: 3,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx, my, 6, pal.mouth);
    px(ctx, mx + 1, my - 1, pal.mouth); px(ctx, mx + 1, my + 1, pal.mouth);
    px(ctx, mx + 3, my - 1, pal.mouth); px(ctx, mx + 3, my + 1, pal.mouth);
    px(ctx, mx + 5, my - 1, pal.mouth); px(ctx, mx + 5, my + 1, pal.mouth);
  },
};
export default stitched;
