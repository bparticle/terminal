import type { PixelDef } from '../types';
import { vline, darken } from '../helpers';

const spikes: PixelDef = {
  name: 'spikes',
  weight: 2,
  draw(ctx, pal, rng) {
    for (let i = 0; i < 8; i++) {
      const sx = 8 + i * 2;
      const h = rng.int(4, 9);
      vline(ctx, sx, 3 - h, h, pal.accent);
      vline(ctx, sx + 1, 3 - h + 1, h - 1, darken(pal.accent, 20));
    }
  },
};
export default spikes;
