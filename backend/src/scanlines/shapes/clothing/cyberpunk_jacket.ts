import type { PixelDef } from '../types';
import { px, rect, hline, vline, darken } from '../helpers';
import { baseShoulders } from './_base';

const cyberpunk_jacket: PixelDef = {
  name: 'cyberpunk_jacket',
  weight: 2,
  draw(ctx, pal, _rng) {
    const clothColor = pal.accent;
    const clothDark = darken(clothColor, 25);
    baseShoulders(ctx, clothColor, clothDark);
    rect(ctx, 13, 23, 6, 2, pal.skin);
    rect(ctx, 0, 27, 32, 5, '#1a1a2a');
    rect(ctx, 2, 26, 28, 1, '#1a1a2a');
    rect(ctx, 4, 25, 24, 1, '#1a1a2a');
    rect(ctx, 10, 24, 12, 1, '#1a1a2a');
    const neon = '#00ffcc';
    hline(ctx, 4, 25, 24, neon);
    vline(ctx, 4, 25, 7, neon);
    vline(ctx, 27, 25, 7, neon);
    px(ctx, 11, 23, neon); px(ctx, 20, 23, neon);
    rect(ctx, 14, 27, 4, 2, '#ff0066');
    px(ctx, 15, 28, '#ffffff');
    vline(ctx, 16, 24, 7, '#333344');
    hline(ctx, 0, 31, 32, '#111122');
  },
};
export default cyberpunk_jacket;
