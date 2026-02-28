# Campaign-Scoped Assets (Phase 2 Options)

## Goal
Add campaign context for identity and item presentation without changing on-chain ownership semantics for already minted assets.

## Constraints
- Keep minted cNFT ownership global at the wallet level.
- Avoid reminting existing assets when a player switches campaigns.
- Preserve current Bubblegum V2 mint/freeze flow stability.

## Option A: Campaign Asset Mapping Tables (Recommended)
- Add `campaign_pfps` table: `(wallet_address, campaign_id, asset_id, image_url, selected_at)`.
- Add `campaign_soulbound_items` table: `(wallet_address, campaign_id, item_name, asset_id, source)`.
- Runtime reads campaign mappings first, then falls back to global profile/items.
- Pros: zero on-chain changes, clear migration path, supports per-campaign presentation.
- Cons: extra joins and sync logic after mint.

## Option B: Campaign Overlay Metadata in `mint_log`
- Keep one canonical asset record, but attach campaign association in `mint_log.nft_metadata`.
- Build read models from `mint_log` for campaign-specific views.
- Pros: fewer new tables.
- Cons: more complex queries and weaker constraints than normalized mapping tables.

## Option C: Campaign-Specific Collections for New Mints
- Future mints target campaign-tagged collections while preserving old global assets.
- Keep mapping table for legacy assets and mixed inventory.
- Pros: strongest campaign isolation for new content.
- Cons: operational overhead (collection lifecycle, indexing, admin tooling).

## Migration Strategy (Phase 2)
1. Introduce mapping tables and backfill from existing global PFP/item state.
2. Add read-path fallback order: `campaign mapping -> global profile/item`.
3. Add write-path updates:
   - PFP selection writes to campaign mapping (and optionally global default).
   - Soulbound mint/background mint writes campaign mapping alongside global tables.
4. Roll out admin tooling for campaign asset inspection and repairs.

## API Surface Changes
- `GET /users/profile` should optionally accept `campaign_id` and return effective campaign-scoped PFP.
- `GET /soulbound/items` should optionally scope by `campaign_id` with a fallback flag.
- `POST /pfp/confirm` and `POST /soulbound/mint-background` should persist campaign mapping when campaign context is provided.

## Risks and Mitigations
- **Race conditions on campaign switch**: include `campaign_id` in write payloads and reject stale updates server-side.
- **Inconsistent fallbacks**: centralize "effective asset resolution" in one backend helper.
- **Data drift**: add periodic reconciliation jobs between global tables and campaign mappings.
