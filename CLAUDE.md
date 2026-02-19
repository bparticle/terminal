# Terminal Text Adventure Game

Retro CRT terminal-themed text adventure game gated by Solana cNFT ownership. Features persistent cloud saves, achievement/campaign tracking, real-time multiplayer chat, embedded mini-games, and an admin panel.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Socket.IO client
- **Backend**: Express.js 4, TypeScript, PostgreSQL (pg), Socket.IO 4, JWT
- **Blockchain**: Solana (`@solana/web3.js`), Helius DAS API (compressed NFTs), Solflare wallet adapter
- **Database**: PostgreSQL 14+ with pgcrypto, JSONB for game state

## Project Structure

```
terminal/
├── CLAUDE.md
├── database/                    # PostgreSQL schema & migrations
│   ├── migrations/
│   │   ├── 001_initial_schema.sql   # All tables, indexes, triggers
│   │   └── 002_add_last_active.sql  # Online presence column
│   ├── schema.sql               # Full schema reference
│   ├── seed.sql                 # Sample campaign data
│   └── run-migration.js         # Migration runner script
├── backend/                     # Express API server (port 3001)
│   └── src/
│       ├── index.ts             # Entry: Express + Socket.IO setup, CORS, routes
│       ├── config/
│       │   ├── constants.ts     # Env vars, production validation
│       │   └── database.ts      # PG pool, query helper, transaction wrapper
│       ├── middleware/
│       │   ├── auth.ts          # requireAuth (JWT), requireAdmin (DB check)
│       │   ├── errorHandler.ts  # AppError class, global error handler
│       │   ├── rateLimiter.ts   # auth/api/write rate limiters
│       │   └── validate.ts      # Input validation helpers
│       ├── routes/
│       │   ├── auth.routes.ts       # POST request-message, verify-wallet
│       │   ├── users.routes.ts      # Profile CRUD, online players, heartbeat
│       │   ├── game.routes.ts       # Load/new/save game, admin: users/metadata
│       │   ├── campaigns.routes.ts  # Campaign CRUD, leaderboards, evaluation
│       │   └── wallet.routes.ts     # NFT collections via Helius
│       ├── services/
│       │   ├── auth.service.ts      # Solana sig verify, nonce mgmt, JWT
│       │   ├── game.service.ts      # Game save CRUD (JSONB operations)
│       │   ├── campaign.service.ts  # Achievements, campaign eval, winners
│       │   └── helius.service.ts    # Helius RPC: searchAssets, getAsset
│       ├── sockets/
│       │   └── chat.socket.ts   # Room-based chat with per-socket rate limits
│       └── types/
│           └── index.ts         # User, GameSave, Campaign, etc. interfaces
├── frontend/                    # Next.js 14 app (port 3000)
│   └── src/
│       ├── app/
│       │   ├── providers.tsx        # Solana wallet + auth context providers
│       │   ├── terminal/
│       │   │   ├── page.tsx         # Terminal page wrapper
│       │   │   ├── GameTerminal.tsx  # Main game UI (terminal I/O, sidebar)
│       │   │   ├── game-terminal.css # CRT effects, scanlines, layout
│       │   │   └── components/
│       │   │       ├── Monitor.tsx       # Matrix rain canvas
│       │   │       ├── StatsBox.tsx      # Campaign progress dots
│       │   │       ├── InventoryBox.tsx  # Paginated item slots
│       │   │       ├── PlayersPanel.tsx  # Online presence list
│       │   │       └── ChatModeToggle.tsx # Command/chat mode switch
│       │   ├── admin/
│       │   │   ├── page.tsx             # Admin dashboard (wallet-gated)
│       │   │   └── components/
│       │   │       ├── Campaigns.tsx     # Campaign CRUD + leaderboards
│       │   │       └── GameUserStatus.tsx # Player search/filter/export
│       │   └── api/
│       │       ├── proxy/[...path]/route.ts  # Backend proxy (allowlisted paths)
│       │       └── rpc/route.ts              # Helius RPC proxy (allowlisted methods)
│       ├── components/terminal/
│       │   ├── SnakeGame.tsx    # Canvas snake mini-game
│       │   └── IframeGame.tsx   # External game iframe wrapper
│       ├── context/
│       │   └── AuthProvider.tsx # JWT session mgmt, wallet signing, fingerprint
│       ├── data/
│       │   └── game-nodes.ts   # Story content: all game nodes (Record<string, GameNode>)
│       ├── lib/
│       │   ├── api.ts           # Base fetch wrapper with auth retry
│       │   ├── game-api.ts      # loadGame, startNewGame, saveGame
│       │   ├── campaign-api.ts  # Campaign & achievement endpoints
│       │   ├── admin-api.ts     # Admin status check, user/metadata queries
│       │   ├── nft-helius.ts    # fetchOwnedNFTs, getNFTDetails
│       │   ├── game-engine.ts   # Core game logic: nodes, state, effects, quizzes
│       │   ├── terminal-commands.ts # help, save, load, theme, inventory, etc.
│       │   ├── useSocket.ts     # Socket.IO hook: room chat, reconnection
│       │   └── types/
│       │       └── game.ts      # GameNode, GameSave, OwnedNFT interfaces
│       └── styles/
│           └── terminal-themes.css  # 3 themes: green, blue, red (CSS vars)
```

## Database Schema

5 tables in PostgreSQL:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Player accounts | `wallet_address` (unique), `name`, `is_admin`, `pfp_image_url`, `last_active_at` |
| `game_saves` | Persistent game state | `wallet_address` (unique), `current_node_id`, `game_state` (JSONB), `inventory` (JSONB) |
| `achievements` | State flags earned | `wallet_address` + `state_name` (unique), `state_value` |
| `campaigns` | Challenge definitions | `target_states[]`, `require_all`, `max_winners`, `sets_state`, `expires_at` |
| `campaign_winners` | Campaign completions | `campaign_id` + `wallet_address` (unique), `rank` |

All tables use UUID primary keys (pgcrypto), `updated_at` triggers, and proper FK cascades.

## Authentication Flow

1. Client requests nonce: `POST /api/v1/auth/request-message` with wallet address
2. Backend generates 32-byte nonce (5-min TTL, stored in memory Map)
3. Client signs message with Solana wallet (Ed25519 via tweetnacl)
4. Client verifies: `POST /api/v1/auth/verify-wallet` with address + message + signature
5. Backend verifies nonce + Ed25519 signature, creates/updates user, returns JWT (24h expiry)
6. Frontend stores JWT in sessionStorage with browser fingerprint validation
7. All authenticated requests use `Authorization: Bearer <token>` via `fetchWithAuth()`

## API Endpoints

All routes prefixed with `/api/v1/`. Frontend proxies through Next.js `/api/proxy/[...path]`.

### Auth (`/auth`) - 10 req/15min
- `POST /request-message` - Get signing nonce
- `POST /verify-wallet` - Verify signature, get JWT

### Users (`/users`) - 100 req/min
- `GET /check-wallet?wallet=` - Check if wallet has account
- `GET /profile` | `PUT /profile` - Auth'd profile CRUD
- `GET /online` - Recently active players (5-min window)
- `POST /heartbeat` - Update presence
- `GET /check-admin` - Admin status check

### Game (`/game`) - 30 req/min (write limiter)
- `GET /load/:wallet_address` - Load game save
- `POST /new` - Create new game save
- `POST /save` - Save state (triggers achievement + campaign evaluation)
- `GET /users` - [Admin] All players with game state
- `GET /metadata` - [Admin] All distinct states and items

### Campaigns (`/campaigns`) - 100 req/min
- `GET /` - Active campaigns | `GET /all` - [Admin] All campaigns
- `GET /:id` | `GET /:id/leaderboard` - Campaign details
- `GET /user/progress` - User achievements + campaign wins
- `POST /` | `PUT /:id` | `DELETE /:id` - [Admin] CRUD
- `POST /:id/evaluate` - [Admin] Retroactive evaluation
- `POST /simulate-achievement` - [Admin] Testing

### Wallet (`/wallet`) - 100 req/min
- `GET /:address/collections` - cNFTs from Helius
- `GET /nft/:id` - Single NFT details

## Game Engine Architecture

The game engine (`frontend/src/lib/game-engine.ts`) processes a graph of **GameNodes** defined in `frontend/src/data/game-nodes.ts`.

### Node Types
- **story** - Narrative text, auto-advance to `next_node`
- **choice** - Text + numbered choices (filtered by requirements)
- **quiz** - Question with `correct_answer`, max attempts, success/failure nodes
- **nft_check** - Gates content behind cNFT ownership (owned/missing branches)
- **godot_game** - Triggers embedded mini-game (Snake), score tracked in state

### Game State Flow
```
User input → terminal-commands.ts (if system command)
           → game-engine.processInput() (if game input)
             → choice selection / quiz answer / minigame / auto-advance
             → applyEffects() (add/remove items, set state flags)
             → moveToNode(nextNodeId)
             → displayCurrentNode()
             → autoSave() every 30s
```

### Save → Achievement → Campaign Pipeline
1. `POST /game/save` updates `game_saves` table
2. `processAchievements()` scans `game_state` for boolean flags → inserts into `achievements`
3. `evaluateCampaigns()` checks active campaigns against user achievements
4. If campaign requirements met → `campaign_winners` entry + optional `sets_state` flag

## Real-Time Chat (Socket.IO)

- JWT authenticated in handshake
- Room-based: players join `room:{nodeId}` on location change
- Per-socket rate limits: 10 joins/min, 10 messages/5s
- IP connection limit: 10 per IP
- Frontend hook: `useSocket.ts` with auto-reconnect (10 attempts, exponential backoff)

## Environment Variables

### Backend `.env`
```
DATABASE_URL=postgresql://user:pass@localhost:5432/terminal_game_db
JWT_SECRET=<min 32 chars in production>
API_KEY=<internal API key>
HELIUS_API_KEY=<helius api key>
COLLECTION_MINT_ADDRESS=<cnft collection mint>
PORT=3001
NODE_ENV=development
ADMIN_WALLETS=wallet1,wallet2
FRONTEND_URL=<required in production for CORS>
```

### Frontend `.env.local`
```
API_BASE_URL=http://localhost:3001/api/v1
API_KEY=<must match backend>
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_COLLECTION_MINT=<cnft collection mint>
NEXT_PUBLIC_HELIUS_RPC_URL=<helius rpc url>
```

## Development

```bash
# Database
createdb terminal_game_db
psql terminal_game_db < database/migrations/001_initial_schema.sql
psql terminal_game_db < database/migrations/002_add_last_active.sql
psql terminal_game_db < database/seed.sql

# Backend (port 3001)
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

Build: `npm run build` in both dirs. Backend compiles to `dist/` via tsc. Frontend uses Next.js build.

## Key Conventions

- All SQL uses parameterized queries (no string interpolation)
- Backend validation via custom `validate.ts` helpers (not a validation library)
- Frontend API calls go through Next.js proxy (`/api/proxy/`) with allowlisted paths
- Game content is authored in `frontend/src/data/game-nodes.ts` as a TypeScript Record
- Three color themes controlled by CSS custom properties on `:root[data-theme]`
- Admin access determined by `is_admin` column in DB (seeded from `ADMIN_WALLETS` env var)
- No test suite currently configured
