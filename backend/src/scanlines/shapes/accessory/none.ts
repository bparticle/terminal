import type { PixelDef } from '../types';

const none: PixelDef = {
  name: 'none',
  weight: 15,
  draw(_ctx, _pal, _rng) {
    // No accessory
  },
};
export default none;
