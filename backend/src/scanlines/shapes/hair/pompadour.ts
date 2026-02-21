import type { PixelDef } from '../types';
import { rect, hline, vline, darken, lighten } from '../helpers';

const pompadour: PixelDef = {
  name: 'pompadour',
  weight: 2,
  draw(ctx, pal, _rng) {
    const h = pal.hair;
    const hd = darken(h, 25);
    const hl = lighten(h, 20);
    // Tall front swept up — 50s rockabilly
    rect(ctx, 8, 2, 16, 4, h);
    // Tall pompadour front
    rect(ctx, 8, -3, 16, 5, h);
    rect(ctx, 9, -4, 14, 2, h);
    hline(ctx, 10, -5, 12, h);
    // Rounded top
    hline(ctx, 11, -6, 10, h);
    // Sides slicked back
    vline(ctx, 7, 3, 6, h);
    vline(ctx, 24, 3, 6, h);
    // Highlight on the pompadour crest
    hline(ctx, 10, -4, 12, hl);
    hline(ctx, 9, -3, 14, hl);
    // Shadow
    hline(ctx, 8, 5, 16, hd);
  },
};
export default pompadour;
