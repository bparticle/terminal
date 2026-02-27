const ITEM_IMAGE_VERSION = process.env.NEXT_PUBLIC_ITEM_IMAGE_VERSION ?? '2026-02-27';

function withVersion(path: string): string {
  return ITEM_IMAGE_VERSION ? `${path}?v=${encodeURIComponent(ITEM_IMAGE_VERSION)}` : path;
}

export function itemPngSrc(itemName: string): string {
  return withVersion(`/items/${itemName}.png`);
}

export function genericItemPngSrc(): string {
  return withVersion('/items/_generic.png');
}

export function genericItemGifSrc(): string {
  return withVersion('/items/_generic.gif');
}
