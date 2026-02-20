# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0-beta] - 2026-02-20

### Added
- Social/private room system: game nodes now support a `social` property to control chat availability per location. Private rooms (cold room, server room, echo archive, signal tower) disable chat, leave the Socket.IO room, and show "You are alone here..." in the players panel
- Maintenance mode with admin toggle: coming-soon page displayed when site is in maintenance, controllable from admin dashboard
- Site settings management: new backend routes, database migration (`003_add_site_settings`), and admin UI for site-wide configuration
- Game reset functionality in admin panel for resetting player game state
- Achievement state auto-generation script (`scripts/extract-achievement-states.js`) that scans game nodes to produce a valid allowlist
- Database seed runner script (`database/run-seed.js`)
- Significantly expanded game content: full story arc with cold room, corridors, registry office, guild district, broadcast room, temple, signal tower, void collective, echo archive, and multiple endings
- Game node example file (`game-nodes.example.ts`) for content authoring reference
- Deployment security documentation (`DEPLOYMENT-SECURITY.md`)

### Changed
- Refactored onboarding flow: removed race selection, simplified to name-only character creation
- Refactored game engine: added conditional content resolution, choice visibility requirements, locked choice display, and display number mapping
- Refactored achievement allowlisting to auto-generate valid states from game node data instead of manual lists
- Refactored database migration and seeding scripts for improved ESM/CJS module loading

### Removed
- Race selection mechanics from onboarding and game state

## [0.4.0-beta] - 2026-02-19

### Added
- Solana wallet authentication with Ed25519 signature verification
- Persistent cloud game saves with JSONB state storage
- Text adventure game engine with story, choice, quiz, and NFT-gated nodes
- Real-time multiplayer chat via Socket.IO with room-based channels
- Campaign and achievement tracking system with leaderboards
- Admin dashboard with player management and campaign CRUD
- cNFT ownership verification via Helius DAS API
- Embedded mini-games (Snake) with score tracking
- Three CRT color themes (green, blue, red)
- Animated SCANLINES title with 5 visual variants
- Online presence system with heartbeat
- Security hardening: rate limiting, input validation, parameterized queries
- Version tracking system with changelog and roadmap

### Security
- JWT authentication with 24h expiry and browser fingerprint validation
- Per-route rate limiting (auth, API, write operations)
- Socket.IO per-socket and per-IP connection limits
- Frontend API proxy with allowlisted paths and methods
