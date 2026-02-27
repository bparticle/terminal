/**
 * Maps item_name (snake_case) to pre-uploaded Arweave metadata URIs.
 *
 * Populated by running:
 *   cd backend && npx ts-node scripts/upload-item-images.ts [--devnet]
 *
 * When a soulbound mint is triggered for an item whose name appears here,
 * the item-specific URI is used instead of the generic INVENTORY_ITEM_URI
 * so the on-chain NFT displays the correct artwork.
 *
 * Items not in this map fall back to the generic URI passed by the caller.
 */
export const ITEM_METADATA_URIS: Record<string, string> = {
  // Example (populated after running the upload script):
  // cold_room_key: 'https://gateway.irys.xyz/...',
  // echo_key:      'https://gateway.irys.xyz/...',
};
