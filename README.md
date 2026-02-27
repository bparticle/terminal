# Scanlines: A Solana-Native Text Adventure

```text
   _____  _________    _   __    __    ____   _   ________  _____
  / ___/ / ____/   |  / | / /   / /   /  _/  / | / / ____/ / ___/
  \__ \ / /   / /| | /  |/ /   / /    / /   /  |/ / __/    \__ \
 ___/ // /___/ ___ |/ /|  /   / /____/ /   / /|  / /___   ___/ /
/____/ \____/_/  |_/_/ |_/   /_____/___/  /_/ |_/_____/  /____/
```

> **Solana Hackathon submission**  
> A text-based game engine with digital ownership, identity, and progression live on-chain via compressed NFTs.
>
> Out of touch retro CLI adventure straight from the `@solana` graveyard.  
> Feels like the 80's // NFT utility like it's still 2022.

Scanlines is a text adventure with wallet sign-in, cNFT-gated gameplay, cloud saves, campaigns, and live chat.

## Why We Built This

Community and technology is the basis of why we are building on Solana. The real fun is when these two meet, and Scanlines is a product that starts with the story, the art, and the player/collector experience. Solana is offering the infrastructure to make user identification and ownership easy and fun.

### Vision

- Make on-chain ownership useful in normal gameplay
- Pair text-first storytelling with modern multiplayer infrastructure
- Use Solana cNFTs in a way that scales and feels simple
- Open the platform to community-authored campaigns and collectible-driven worlds
- Keep blockchain in the background as infrastructure
- Evolve from one default skin into a creator-friendly platform with many visual styles

### Core Thesis

- **Text-first works**: commands and narrative keep players focused
- **Social matters**: live explorer chat turns a solo game into a shared world

## Highlights

- **Text-first UI** with command-driven interaction and theme support
- **Solana wallet authentication** (signed nonce + JWT session)
- **cNFT-gated nodes and mint actions** integrated into story progression
- **Persistent game saves** in PostgreSQL (state, inventory, node position)
- **Campaign and achievement system** with winner tracking and leaderboards
- **Real-time room chat** powered by Socket.IO
- **Admin panel** for campaign operations and game telemetry
- **Embedded mini-games** (e.g. Snake) connected to game state (using Godot as embedded game engine)

## Solana Integration

This project uses Solana directly in core game systems:

- Compressed NFTs (Bubblegum V2) for scalable minting
- Helius DAS/RPC for asset indexing and transaction flow
- Wallet-native auth flow with Ed25519 signature verification
- User-paid and server-paid mint pipelines
- Optional soulbound item minting + freeze flows for inventory permanence

## Architecture

### System Overview

```text
Frontend (Next.js App Router)
  -> API Proxy (/api/proxy/*, /api/rpc)
  -> Backend (Express + Socket.IO)
      -> PostgreSQL (game saves, campaigns, winners, mint logs)
      -> Solana + Helius (cNFT minting, proofs, wallet assets)
```

### Repository Layout

```text
terminal/
|- frontend/                 # Next.js 14 app (terminal UI + admin)
|  |- src/app/terminal/      # Main gameplay experience
|  |- src/app/admin/         # Admin dashboard
|  |- src/lib/               # Game engine, API clients, socket hooks
|  |- src/data/              # Story graph and game nodes
|  `- src/styles/            # Themes + terminal styling
|- backend/                  # Express API + Socket.IO server
|  |- src/routes/            # Auth, game, campaigns, mint, wallet, pfp
|  |- src/services/          # Core business logic and Solana integrations
|  |- src/middleware/        # Auth, validation, rate limiting, errors
|  `- scripts/               # On-chain setup/testing utilities
|- database/                 # SQL schema, migrations, and seed data
`- docs/                     # Extended architecture and project docs
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Socket.IO, TypeScript, PostgreSQL
- **Blockchain**: Solana, `@solana/web3.js`, Bubblegum V2, Helius DAS/RPC
- **Auth**: Wallet signature verification + JWT
- **Storage**: JSONB-backed game state and inventory persistence

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Solana wallet
- Helius API key

### 1) Clone and install

```bash
git clone <your-repo-url>
cd terminal
```

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Initialize database

```bash
createdb terminal_game_db
psql terminal_game_db < database/migrations/001_initial_schema.sql
psql terminal_game_db < database/migrations/002_add_last_active.sql
psql terminal_game_db < database/migrations/003_mint_whitelist_and_log.sql
psql terminal_game_db < database/migrations/004_soulbound_items.sql
psql terminal_game_db < database/migrations/005_pfp_mint_tracking.sql
psql terminal_game_db < database/seed.sql
```

### 3) Configure environment variables

Create:

- `backend/.env`
- `frontend/.env.local`

Minimum values to run locally:

| File | Variable | Description |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | PostgreSQL connection string |
| `backend/.env` | `JWT_SECRET` | JWT signing secret (32+ chars) |
| `backend/.env` | `API_KEY` | Shared internal API key |
| `backend/.env` | `HELIUS_API_KEY` | Helius key for Solana integration |
| `frontend/.env.local` | `API_BASE_URL` | Usually `http://localhost:3001/api/v1` |
| `frontend/.env.local` | `API_KEY` | Must match backend `API_KEY` |
| `frontend/.env.local` | `NEXT_PUBLIC_SOCKET_URL` | Usually `http://localhost:3001` |
| `frontend/.env.local` | `NEXT_PUBLIC_ITEM_IMAGE_VERSION` | Cache-bust version for `/public/items` assets (e.g. `2026-02-27`) |

When you ship updated item art with the same filenames, bump `NEXT_PUBLIC_ITEM_IMAGE_VERSION` and redeploy the frontend to force browsers to fetch the new images.

### 4) Run the app

```bash
cd backend && npm run dev
```

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000/terminal`.

## Game Content and Customization

### Add or edit story nodes

Update `frontend/src/data/game-nodes.ts`:

- `story` nodes for narrative flow
- `choice` nodes for branching paths
- `quiz`, `nft_check`, `mint_action`, `pfp_mint`, and mini-game nodes
- Effects for inventory/state mutations

### Tune themes and future skins

Edit `frontend/src/styles/terminal-themes.css` to adjust the current theme system.  
The current CRT style is the default presentation, with broader skin support planned.

### Manage campaigns

Use SQL seed data as a template or manage campaigns from admin/API routes.

## Deployment and Infrastructure

- **Production targets**: frontend (Next.js), backend (Node/Express), PostgreSQL
- **Platform examples**: Railway, Render, Vercel, Dockerized VPS
- **Environment hardening**: production `JWT_SECRET`, restricted CORS, secure key management, rate-limits enabled

## Security Notes

- Nonce-based wallet auth with short-lived challenge messages
- JWT-protected API and Socket.IO handshake validation
- Parameterized SQL queries across backend data access
- Route-level rate limiting for auth, write, and API surfaces

## Roadmap

- Community-authored campaigns and narrative packs
- Deeper on-chain progression and collectible utility
- Expanded mini-game ecosystem and seasonal events
- Richer creator/admin tooling for campaign operations
- Creator-made visual skins and presentation layers beyond CRT/Retro
- AI-assisted worldbuilding and campaign authoring tools

## License

Private project for hackathon evaluation unless otherwise specified by repository owner.
