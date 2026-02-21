/**
 * Ambient type declarations for node-canvas types.
 *
 * The scanlines shape files reference DOM types (CanvasRenderingContext2D,
 * ImageData) by their global names. Since the backend tsconfig doesn't
 * include "DOM" in lib, we declare these globals using the canvas package's
 * own type definitions. This avoids incompatibilities between the canvas
 * package's types and the full DOM spec.
 */

import type { CanvasRenderingContext2D as NodeCanvasCtx, ImageData as NodeImageData } from 'canvas';

declare global {
  type CanvasRenderingContext2D = NodeCanvasCtx;
  type ImageData = NodeImageData;
}
