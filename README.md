# Terminal Text Adventure Game

A retro CRT terminal-themed text adventure game that runs in the browser. Gated by Solana compressed NFT (cNFT) ownership, with persistent cloud saves, achievement tracking, and embedded mini-games.

## Architecture

```
terminal/
├── database/               # PostgreSQL schema & migrations
│   ├── schema.sql          # Full schema definition
│   ├── migrations/         # Versioned migration files
│   └── seed.sql            # Sample data (campaign)
├── backend/                # Node.js/Express API server
│   └── src/
│       ├── config/         # Database pool, constants
│       ├── middleware/      # Auth JWT, error handler
│       ├── routes/         # Auth, users, game, campaigns, wallet
│       ├── services/       # Auth, game, campaign, Helius
│       └── types/          # TypeScript interfaces
├── frontend/               # Next.js 14 (App Router)
│   └── src/
│       ├── app/terminal/   # Main terminal page + components
│       ├── app/api/        # Proxy routes (backend + RPC)
│       ├── context/        # AuthProvider (wallet sign-in)
│       ├── components/     # SnakeGame, IframeGame
│       ├── data/           # Game nodes (story content)
│       ├── lib/            # Game engine, API clients, types
│       └── styles/         # Theme CSS variables
└── docs/
    ├── prompt.md
    └── terminal-game-full-architecture.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Solana wallet (Solflare recommended)
- Helius API key (for NFT features)

### 1. Database Setup

```bash
createdb terminal_game_db
psql terminal_game_db < database/migrations/001_initial_schema.sql
psql terminal_game_db < database/seed.sql  # Optional: sample campaign
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Edit with your values
npm install
npm run dev            # Starts on port 3001
```

### 3. Frontend

```bash
cd frontend
# Edit .env.local with your values
npm install
npm run dev            # Starts on port 3000
```

### 4. Play

Open http://localhost:3000/terminal in your browser.

## Configuration

### Backend `.env`

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `API_KEY` | Internal API key for proxy auth |
| `HELIUS_API_KEY` | Helius RPC API key |
| `COLLECTION_MINT_ADDRESS` | Your cNFT collection mint |
| `PORT` | Server port (default: 3001) |

### Frontend `.env.local`

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend URL (e.g., http://localhost:3001/api/v1) |
| `API_KEY` | Must match backend API_KEY |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC proxy path |
| `NEXT_PUBLIC_HELIUS_RPC_URL` | Helius RPC URL |
| `NEXT_PUBLIC_COLLECTION_MINT` | Your cNFT collection mint |

## Customization

### Adding Game Content

Edit `frontend/src/data/game-nodes.ts` to add your story. Each node has:
- `id` - Unique string identifier
- `type` - story, choice, quiz, nft_check, godot_game
- `content` - Narrative text (supports `{{state.key}}` templates)
- `choices` - Branching options with requirements
- `effects` - Items and state changes

### Changing Themes

Edit `frontend/src/styles/terminal-themes.css` to customize the three color themes. All colors derive from CSS custom properties.

### Campaign Setup

Use the seed.sql as a template, or create campaigns via the admin API endpoints with an admin user.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Blockchain**: Solana, @solana/web3.js, Helius DAS API
- **Auth**: Wallet signature verification, JWT sessions
