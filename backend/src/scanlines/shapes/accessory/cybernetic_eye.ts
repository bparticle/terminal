import type { PixelDef } from '../types';
import { px, rect, hline } from '../helpers';

const cybernetic_eye: PixelDef = {
  name: 'cybernetic_eye',
  weight: 2,
  draw(ctx, pal, _rng) {
    rect(ctx, 18, 9, 6, 5, '#333344');
    rect(ctx, 19, 10, 4, 3, '#001122');
    rect(ctx, 20, 10, 2, 2, '#ff0044');
    px(ctx, 20, 10, '#ffffff');
    hline(ctx, 24, 11, 3, '#ff004488');
    px(ctx, 18, 8, '#555566'); px(ctx, 23, 8, '#555566');
    px(ctx, 18, 14, '#555566'); px(ctx, 23, 14, '#555566');
  },
};
export default cybernetic_eye;
