import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const cigar: PixelDef = {
  name: 'cigar',
  weight: 3,
  draw(ctx, pal, _rng) {
    const mx = 13, my = 17;
    hline(ctx, mx + 1, my, 3, pal.mouth);
    rect(ctx, mx + 4, my - 1, 5, 2, '#6b4226');
    rect(ctx, mx + 4, my - 1, 1, 2, '#5a3520');
    px(ctx, mx + 8, my - 1, '#cc4400');
    px(ctx, mx + 8, my, '#ff6600');
    px(ctx, mx + 9, my - 2, '#99999944');
    px(ctx, mx + 10, my - 3, '#99999933');
    px(ctx, mx + 8, my - 3, '#99999922');
  },
};
export default cigar;
