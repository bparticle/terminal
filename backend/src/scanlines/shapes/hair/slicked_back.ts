import type { PixelDef } from '../types';
import { rect, hline, vline, px, darken, lighten } from '../helpers';

const slicked_back: PixelDef = {
  name: 'slicked_back',
  weight: 6,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Smooth backward-combed hair
    rect(ctx, 8, 2, 16, 4, h);
    hline(ctx, 9, 1, 14, h);
    // Slicked lines
    hline(ctx, 9, 2, 14, hl);
    hline(ctx, 9, 4, 14, hd);
    // Subtle sides
    vline(ctx, 7, 4, 4, h);
    vline(ctx, 24, 4, 4, h);
    // Combed-back texture
    for (let x = 9; x < 23; x += 2) px(ctx, x, 3, hl);
  },
};
export default slicked_back;
