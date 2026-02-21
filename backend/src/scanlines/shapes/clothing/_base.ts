/**
 * Shared clothing base — shoulder/torso foundation shape.
 * Most clothing types call this first, then add details on top.
 */

import { rect, hline, vline, px } from '../helpers';

export function baseShoulders(
  ctx: CanvasRenderingContext2D,
  clothColor: string,
  clothDark: string,
): void {
  rect(ctx, 0, 27, 32, 5, clothColor);
  rect(ctx, 2, 26, 28, 1, clothColor);
  rect(ctx, 4, 25, 24, 1, clothColor);
  rect(ctx, 10, 24, 12, 1, clothColor);
  px(ctx, 1, 27, clothColor);
  px(ctx, 30, 27, clothColor);
  hline(ctx, 12, 23, 8, clothDark);
  hline(ctx, 0, 31, 32, clothDark);
  vline(ctx, 0, 28, 3, clothDark);
  vline(ctx, 31, 28, 3, clothDark);
}
