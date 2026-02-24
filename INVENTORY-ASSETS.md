# SCANLINES — Inventory Item Assets

All item images should be placed in `frontend/public/items/`.

**Format**: PNG-24 with alpha transparency
**Canvas size**: 48×48 px (1:1 square — do not use rectangular images)
**Color depth**: 8-bit RGBA
**Style**: Pixel art, limited palette, designed to read clearly at small sizes on a dark background

The inventory slots render at roughly 50–70px on desktop and ~40px on mobile. At these sizes, 48×48 source art with `image-rendering: pixelated` scales cleanly at both 1× and 2× device pixel ratios without blurring. Avoid anti-aliased edges — use hard pixel boundaries so the pixelated rendering looks intentional.

**Do not** bake glow, shadow, or background color into the image. The slot background is dark (`rgba(0,0,0,0.3)`) and the border is theme-colored, so the image should be the item only on a fully transparent background.

---

## How Inventory Assets Work

The inventory UI (`frontend/src/app/terminal/components/InventoryBox.tsx`) renders each item with a two-level image fallback:

1. `/items/{item_name}.png` — item-specific art
2. `/items/_generic.png` — generic fallback if no specific art exists
3. Emoji — last resort if `_generic.png` is also missing

### Adding a new inventory asset

1. **Identify the exact item name** used in `game-nodes.ts`. Items are added via `effects.add_item` — the string in that array is the item's canonical name. Example: `add_item: ['cold_room_key']` means the name is `cold_room_key`.

2. **Create the image file** named `{item_name}.png` — the filename must match the item name exactly (snake_case, lowercase). Place it at:
   ```
   frontend/public/items/{item_name}.png
   ```
   Example: `frontend/public/items/cold_room_key.png`

3. **That's it.** No code changes are needed. The `ItemIcon` component automatically resolves `/items/{item_name}.png` at render time. If the file exists, it displays; if not, the generic fallback kicks in.

### Filename convention

| Item name in `game-nodes.ts` | Image file path |
|------------------------------|-----------------|
| `cold_room_key` | `frontend/public/items/cold_room_key.png` |
| `echo_key` | `frontend/public/items/echo_key.png` |
| `phosphor_residue` | `frontend/public/items/phosphor_residue.png` |
| `tape_reel_7` | `frontend/public/items/tape_reel_7.png` |

### Soulbound items

Items with a soulbound on-chain NFT display a **⛓ chain badge** in the bottom-right corner of the slot. The item still shows its normal image (or generic fallback). Hovering a soulbound item shows a tooltip with the on-chain asset ID, freeze status, and a link to view the NFT on Helius Xray.

### Emoji fallback

When neither the item-specific image nor `_generic.png` can be loaded, `getItemEmoji()` maps keywords in the item name to an emoji (e.g. "key" → 🔑, "tape" → 📼). Items that don't match any keyword get 📦. This fallback is defined at the bottom of `InventoryBox.tsx`.

---

## Item Groups

Items are grouped by visual/conceptual family. Where multiple items represent different states of the same object, they are listed together so you can design them as variations of one base asset.

Status key: ✅ Done | ⏳ Pending

---

### Generic Fallback (1 asset)

| Status | File | Description |
|--------|------|-------------|
| ⏳ | `frontend/public/items/_generic.png` | Fallback icon shown when no item-specific image exists. Should be a neutral, generic pixel-art "item" silhouette — e.g. a simple glowing orb, a small package, or an abstract data chip. Must read clearly on a dark background. Used for any new item that doesn't have its own art yet. |

---

### Group A: The First Pixel (2 states)

A luminous pixel fragment taken from a dead monitor. The base version glows brightly; the spent version is dimmed and cracked.

| Status | # | File | State | Description |
|--------|---|------|-------|-------------|
| ⏳ | 1 | `frontend/public/items/first_pixel.png` | Active | A bright, singular pixel fragment. Ancient relic, radiating light. Can be offered at the Temple or used on the Book of Null. |
| ⏳ | 2 | `frontend/public/items/spent_first_pixel.png` | Spent | The same pixel, now drained. Dimmed, cracked, hollow glow. A memento with no further use. |

**Design note**: Same shape/silhouette, but `spent` version should look depleted — faded color, cracks, no glow.

---

### Group B: Keys (3 items — same category, different origins)

Three key-type items that unlock different areas. Visually distinct from each other but all recognizable as "access" objects.

| Status | # | File | Description |
|--------|---|------|-------------|
| ✅ | 3 | `frontend/public/items/cold_room_key.png` | A physical metal key found after waiting in the cold room. Opens the cold room door and the Registry Office drawer. Standard key shape. |
| ✅ | 4 | `frontend/public/items/echo_key.png` | A key discovered in a hidden panel inside the cold room. More unusual/ornate. Unlocks the Echo Archive and an alternate Temple entrance. |
| ⏳ | 5 | `frontend/public/items/void_key.png` | A dark, ominous key granted by the Void Collective after initiation. Opens the Void path in the server room, can be used on the Book of Null, and unlocks the Void Evolution ending. Should feel alien/corrupted compared to the other keys. |

**Design note**: All three should read as "key" at a glance but with clearly different aesthetics — `cold_room_key` is mundane/industrial, `echo_key` is mysterious/resonant, `void_key` is dark/corrupted.

---

### Group C: Data Records (3 items — documents/logs)

Information items stored on physical or digital media. All represent "knowledge found" but from different sources.

| Status | # | File | Description |
|--------|---|------|-------------|
| ⏳ | 6 | `frontend/public/items/archivist_log_9.png` | A data log recovered from a drawer in the Registry Office. Old administrative record. Used to access restricted systems (cold room terminal, guild server room, broadcast console). Could look like a small data card or log chip. |
| ⏳ | 7 | `frontend/public/items/root_access_log.png` | A system-level access log recovered from cold room terminal waveform analysis. Proof of deep system access. Used as a credential in the server room and to analyze the signal tower. Should feel more "high-clearance" than the archivist log. |
| ✅ | 8 | `frontend/public/items/guild_access_files.png` | Classified files from the restricted shelf in the Registry Office. Internal Guild documentation. Currently a lore/flavor item with no gate usage. Could look like a sealed folder or document stack. |

**Design note**: Visual hierarchy — `archivist_log_9` is common/old, `root_access_log` is rare/high-level, `guild_access_files` is faction-branded with Guild identity.

---

### Group D: Phosphor & Lab Equipment (2 items)

Items related to the Phosphor Calibration Lab and CRT monitor chemistry.

| Status | # | File | Description |
|--------|---|------|-------------|
| ✅ | 9 | `frontend/public/items/phosphor_residue.png` | Phosphor residue collected in a glass vial from the cracked monitor in the north corridor. Multi-use utility: reveals hidden paths (vent, NULL door), accesses the `/null` terminal directory, searches the broadcast room, activates a Temple sensor. Consumed on several uses. |
| ⏳ | 16 | `frontend/public/items/glass_vial.png` | A laboratory-grade borosilicate vial found in the abandoned Phosphor Calibration Lab. Cork-stoppered, designed to hold reactive compounds. Used to collect phosphor residue from the cracked monitor in corridor north. Consumed when filled with residue. |

**Design note**: `phosphor_residue` should look like a corked vial filled with luminescent green-white material, pulsing glow. `glass_vial` should look like the same vial shape but empty/clear, with the cork stopper visible.

---

### Group E: Faction Emblem

| Status | # | File | Description |
|--------|---|------|-------------|
| ⏳ | 10 | `frontend/public/items/guild_sigil.png` | The official emblem of the Guild, received upon accepting their mission. Grants access to the Guild Server Room, restricted Registry shelves, a unique Temple entrance, and the Guild Restoration ending. |

**Design note**: A badge or seal. Should feel authoritative and institutional — the Guild's brand.

---

### Group F: Temple Artifacts (2 items — from the Book of Null)

Objects recovered from or related to the Book of Null inside the Temple. Lore-heavy, mysterious.

| Status | # | File | Description |
|--------|---|------|-------------|
| ⏳ | 11 | `frontend/public/items/corrupted_page.png` | A torn page from the Book of Null. Glitched and partially illegible. Can be shown to the Guild or the Void Collective. May be surrendered to the Guild (removed from inventory on surrender). |
| ⏳ | 12 | `frontend/public/items/memory_shard.png` | A crystallized data fragment recovered from the Echo Archive vault. Contains encoded memories. Can be shown to the Guild or used on the Book of Null. |

**Design note**: `corrupted_page` should look like torn paper with glitch artifacts/static. `memory_shard` should look like a crystal or gem with data patterns inside — distinct from the page but both feel "ancient knowledge."

---

### Group G: Broadcast / Signal Items (2 items — related to communication systems)

Items tied to the broadcast room and signal tower. Both involve transmission and signals.

| Status | # | File | Description |
|--------|---|------|-------------|
| ⏳ | 13 | `frontend/public/items/tape_reel_7.png` | A magnetic tape reel recovered from the broadcast room (via cipher solve or phosphor search). Contains an old recording. Can be played on guild server speakers, played near the Temple figure, attached to the signal tower. Required (with active tower) for the Third Signal ending. |
| ⏳ | 14 | `frontend/public/items/signal_tower_code.png` | An activation code extracted from the cold room terminal alongside the root access log. Required to approach and activate the signal tower. Can also transmit from the broadcast room. Consumed when the tower is activated. |

**Design note**: `tape_reel_7` is physical media — a classic reel-to-reel tape. `signal_tower_code` is digital — a code chip, punch card, or encoded data strip. Both are "signal/broadcast" themed.

---

### Group H: Void Fragment

| Status | # | File | Description |
|--------|---|------|-------------|
| ⏳ | 15 | `frontend/public/items/null_fragment.png` | A void-touched data shard extracted from the cold room terminal's `/null` directory using phosphor residue. Can be placed on the broadcast console, shown to the Void Collective, or used on the mirror figure inside the Temple. |

**Design note**: Should feel related to `void_key` (Group B) in aesthetic — dark, glitchy, corrupted. A shard or fragment rather than a key shape.

---

## Summary

| Group | Items | Status |
|-------|-------|--------|
| Generic | `_generic` | ⏳ |
| A | `first_pixel`, `spent_first_pixel` | ⏳ ⏳ |
| B | `cold_room_key`, `echo_key`, `void_key` | ✅ ✅ ⏳ |
| C | `archivist_log_9`, `root_access_log`, `guild_access_files` | ⏳ ⏳ ✅ |
| D | `phosphor_residue`, `glass_vial` | ✅ ⏳ |
| E | `guild_sigil` | ⏳ |
| F | `corrupted_page`, `memory_shard` | ⏳ ⏳ |
| G | `tape_reel_7`, `signal_tower_code` | ⏳ ⏳ |
| H | `null_fragment` | ⏳ |

**Done: 4 of 17 assets** (`cold_room_key`, `echo_key`, `guild_access_files`, `phosphor_residue`)
**Pending: 13 assets** (12 item-specific + 1 generic fallback)
