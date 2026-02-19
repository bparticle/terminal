# Roadmap

Current version: **0.4.0-beta**

This project follows [Semantic Versioning](https://semver.org). We are in the **beta** pre-release stage (0.x), meaning the core architecture is in place but the full feature set is not yet complete. Breaking changes may occur between minor versions until 1.0.

## Version Plan

### 0.5.0-beta — NFT Monitor Display
- [ ] Display owned NFTs visually in the Monitor component
- [ ] NFT gallery/carousel view with metadata
- [ ] NFT-specific game interactions based on held assets

### 0.6.0-beta — cNFT Minting in CLI
- [ ] Mint compressed NFTs directly from the terminal CLI
- [ ] Mint transaction status and confirmation flow
- [ ] Collection management for minted assets

### 0.7.0-beta — Soulbound Inventory Items
- [ ] Mint soulbound (non-transferable) tokens for inventory items
- [ ] On-chain inventory verification
- [ ] Soulbound item display and management in the inventory UI

### 0.8.0-beta — Content & Polish
- [ ] Expanded game content and story nodes
- [ ] Improved mobile experience
- [ ] Performance optimizations

### 0.9.0-beta — Pre-release
- [ ] End-to-end testing suite
- [ ] Documentation and onboarding
- [ ] Bug fixes and stability

### 1.0.0 — Stable Release
- [ ] All beta features complete and tested
- [ ] Production deployment hardening
- [ ] Public launch

## How to Bump Versions

1. Update `frontend/src/lib/version.ts` (the `APP_VERSION` constant)
2. Update `version` in root `package.json`, `frontend/package.json`, and `backend/package.json`
3. Add a new versioned section in `CHANGELOG.md` (move items from `[Unreleased]`)
4. Commit with message: `chore: bump version to X.Y.Z`
