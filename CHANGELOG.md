# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
