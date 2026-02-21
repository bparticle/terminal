import type { PixelDef } from '../types';
import { px } from '../helpers';

const spiral: PixelDef = {
  name: 'spiral',
  weight: 1,
  draw(ctx, pal, _rng) {
    const ly = 11, lx = 11, rx = 19;
    const drawSpiral = (cx: number, cy: number) => {
      px(ctx, cx, cy, pal.eyes);
      px(ctx, cx + 1, cy, pal.eyes); px(ctx, cx + 2, cy, pal.eyes);
      px(ctx, cx + 2, cy + 1, pal.eyes);
      px(ctx, cx + 2, cy + 2, pal.eyes); px(ctx, cx + 1, cy + 2, pal.eyes);
      px(ctx, cx, cy + 2, pal.eyes);
      px(ctx, cx, cy + 1, '#000000');
      px(ctx, cx + 1, cy + 1, pal.eyes);
      px(ctx, cx - 1, cy - 1, pal.eyes); px(ctx, cx - 1, cy, pal.eyes);
      px(ctx, cx - 1, cy + 1, pal.eyes);
    };
    drawSpiral(lx, ly - 1);
    drawSpiral(rx, ly - 1);
  },
};
export default spiral;
