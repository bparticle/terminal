import type { PixelDef } from '../types';
import { px, vline } from '../helpers';

const antenna: PixelDef = {
  name: 'antenna',
  weight: 2,
  draw(ctx, pal, _rng) {
    vline(ctx, 16, 0, 4, pal.accent);
    px(ctx, 15, 0, pal.eyes); px(ctx, 17, 0, pal.eyes);
  },
};
export default antenna;
