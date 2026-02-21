import type { PixelDef } from '../types';
import { px, hline } from '../helpers';

const face_tattoo: PixelDef = {
  name: 'face_tattoo',
  weight: 4,
  draw(ctx, pal, _rng) {
    const tc = pal.accent;
    px(ctx, 8, 12, tc); px(ctx, 8, 14, tc); px(ctx, 8, 16, tc);
    hline(ctx, 7, 13, 2, tc); hline(ctx, 7, 15, 2, tc);
    px(ctx, 23, 12, tc); px(ctx, 23, 14, tc); px(ctx, 23, 16, tc);
    hline(ctx, 23, 13, 2, tc); hline(ctx, 23, 15, 2, tc);
    px(ctx, 16, 5, tc);
    px(ctx, 15, 6, tc); px(ctx, 17, 6, tc);
    px(ctx, 16, 7, tc);
    hline(ctx, 10, 14, 3, tc);
    hline(ctx, 19, 14, 3, tc);
  },
};
export default face_tattoo;
