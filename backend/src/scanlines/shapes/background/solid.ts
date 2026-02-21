import type { PixelDef } from '../types';

const solid: PixelDef = {
  name: 'solid',
  weight: 15,
  draw(_ctx, _pal, _rng) {
    // Base fill is done by generator before calling shape
  },
};
export default solid;
