import type { PixelDef } from '../types';

const bald: PixelDef = {
  name: 'bald',
  weight: 10,
  draw(_ctx, _pal, _rng) {
    // No hair at all — clean head
  },
};
export default bald;
