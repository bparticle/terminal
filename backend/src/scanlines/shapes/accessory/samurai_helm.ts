import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const samurai_helm: PixelDef = {
  name: 'samurai_helm',
  weight: 1,
  draw(ctx, pal, _rng) {
    rect(ctx, 6, 1, 20, 4, '#666677');
    hline(ctx, 6, 4, 20, '#444455');
    rect(ctx, 14, -2, 4, 3, '#ccaa44');
    px(ctx, 15, -3, '#ccaa44'); px(ctx, 16, -3, '#ccaa44');
    rect(ctx, 3, 2, 3, 3, '#666677');
    rect(ctx, 26, 2, 3, 3, '#666677');
    px(ctx, 3, 4, '#555566'); px(ctx, 28, 4, '#555566');
    hline(ctx, 8, 5, 16, '#555566');
  },
};
export default samurai_helm;
