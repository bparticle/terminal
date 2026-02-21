import type { PixelDef } from '../types';
import { px } from '../helpers';

const buzz: PixelDef = {
  name: 'buzz',
  weight: 9,
  draw(ctx, pal, rng) {
    const h = pal.hair;
    // Very short cropped — scattered dots on top of head
    for (let y = 2; y < 6; y++)
      for (let x = 8; x < 24; x++)
        if (rng.chance(0.45)) px(ctx, x, y, h);
    // Slight sideburns
    px(ctx, 7, 6, h); px(ctx, 7, 7, h);
    px(ctx, 24, 6, h); px(ctx, 24, 7, h);
  },
};
export default buzz;
