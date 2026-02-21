import type { PixelDef } from '../types';
import { rect, hline, vline } from '../helpers';

const headphones: PixelDef = {
  name: 'headphones',
  weight: 5,
  draw(ctx, pal, _rng) {
    hline(ctx, 6, 3, 20, '#333333'); hline(ctx, 6, 2, 20, '#444444');
    rect(ctx, 4, 9, 3, 5, '#333333'); rect(ctx, 5, 10, 1, 3, '#555555');
    rect(ctx, 25, 9, 3, 5, '#333333'); rect(ctx, 26, 10, 1, 3, '#555555');
    vline(ctx, 5, 3, 7, '#333333'); vline(ctx, 26, 3, 7, '#333333');
  },
};
export default headphones;
