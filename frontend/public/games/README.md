Shared Godot web export runtime

We reuse a single Godot runtime for all games to avoid duplicating the large `.wasm` file.
Currently, these files are shared in `public/games/_GODOT/`:
- `godot.wasm`
- `godot.audio.worklet.js`
- `godot.audio.position.worklet.js`

When adding a new game:
- Keep the game's `*.js`, `*.pck`, `*.html`, and image files in its own folder.
- In the game's `.html`, set `GODOT_CONFIG.executable` to `../_GODOT/godot`.
- Add `mainPack` to point at the game's pack file, for example `mainPack: "<game>.pck"`.
- Update `fileSizes` to include both `<game>.pck` and `../_GODOT/godot.wasm`.
- Do not include a `<game>.wasm` file in the new game's folder.

If the shared runtime ever changes (export settings or Godot version), replace the shared files in `_GODOT` and update the `fileSizes` entry as needed.
