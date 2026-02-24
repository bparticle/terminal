# Inventory Assets (In-Game Only)

This file only tracks inventory items that are currently obtainable in gameplay (`effects.add_item`) and therefore can appear in the player inventory.

All item images should be placed in `frontend/public/items/`.

## Asset Format Expectations

- Format: `PNG` with transparent background
- Recommended size: `48x48` pixels (square)
- Style: pixel-art friendly, high contrast on dark UI
- Naming: exact item id match, lowercase snake_case

Image resolution order in the inventory UI:
1. `/items/{item_id}.png`
2. `/items/_generic.png`
3. Emoji fallback

## Required/Valid Item Filenames

| Item ID (canonical) | Expected file path | Description | Gameplay usage |
|---|---|---|---|
| `_generic` | `frontend/public/items/_generic.png` | Generic fallback icon for any missing item art. | Used automatically when item-specific image does not exist. |
| `archivist_log_9` | `frontend/public/items/archivist_log_9.png` | Old archivist log/data record from the Registry path. | Used in multiple progression checks and dialog branches. |
| `cold_room_key` | `frontend/public/items/cold_room_key.png` | Physical key from early cold-room progression. | Unlocks early pathing and registry interactions. |
| `corrupted_page` | `frontend/public/items/corrupted_page.png` | Glitched page from Book of Null content. | Used in faction/temple progression and can be surrendered (removed). |
| `echo_key` | `frontend/public/items/echo_key.png` | Resonant key tied to Echo route access. | Unlocks specific route options and branches. |
| `first_pixel` | `frontend/public/items/first_pixel.png` | Active luminous pixel artifact. | Used in major branching choices; later transformed to spent variant. |
| `glass_vial` | `frontend/public/items/glass_vial.png` | Empty lab vial. | Used to collect phosphor residue; then consumed/removed. |
| `guild_access_files` | `frontend/public/items/guild_access_files.png` | Classified Guild documents. | Obtainable lore item that can appear in inventory. |
| `guild_sigil` | `frontend/public/items/guild_sigil.png` | Guild emblem/badge item. | Gates Guild-aligned areas and related outcomes. |
| `null_fragment` | `frontend/public/items/null_fragment.png` | Void-corrupted data fragment. | Used in Void/broadcast progression checks. |
| `phosphor_residue` | `frontend/public/items/phosphor_residue.png` | Reactive phosphor material in vial. | Used in several interactions and consumed in specific actions. |
| `root_access_log` | `frontend/public/items/root_access_log.png` | High-privilege system access log. | Used as credential in late-game progression branches. |
| `signal_tower_code` | `frontend/public/items/signal_tower_code.png` | Activation code for the signal system. | Required for tower-related actions; consumed on activation path. |
| `spent_first_pixel` | `frontend/public/items/spent_first_pixel.png` | Depleted version of the first pixel artifact. | Appears after `first_pixel` is spent/transformed. |
| `void_key` | `frontend/public/items/void_key.png` | Key granted on Void route progression. | Gates Void-specific options and endings. |
