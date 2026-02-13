# Terminal Text Adventure Game — Complete Architecture Document

> **Purpose**: This document describes every aspect of the terminal-based text adventure game so that another development team (or LLM) can recreate the entire project — frontend, backend API, database, wallet integration, and visual design — as a standalone website for a different cNFT collection.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Backend API (Reverse-Engineered)](#4-backend-api-reverse-engineered)
5. [Database Schema (Inferred)](#5-database-schema-inferred)
6. [Authentication Flow](#6-authentication-flow)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Game Engine](#8-game-engine)
9. [Game Node System](#9-game-node-system)
10. [Terminal UI Components](#10-terminal-ui-components)
11. [Visual Design & Styling](#11-visual-design--styling)
12. [Wallet & Blockchain Integration](#12-wallet--blockchain-integration)
13. [NFT Ownership Gating](#13-nft-ownership-gating)
14. [Campaign / Achievement System](#14-campaign--achievement-system)
15. [Embedded Mini-Games (Godot)](#15-embedded-mini-games-godot)
16. [Terminal Commands](#16-terminal-commands)
17. [Mobile Responsive Design](#17-mobile-responsive-design)
18. [API Proxy Layer](#18-api-proxy-layer)
19. [Deployment & Environment](#19-deployment--environment)
20. [Recreating This Project](#20-recreating-this-project)

---

## 1. Project Overview

This is a **retro terminal-themed text adventure game** that runs in a web browser. It is designed for holders of a compressed NFT (cNFT) collection on the Solana blockchain. The game presents a fully interactive text-based world where players explore locations, make choices, collect items, solve quizzes, play embedded Godot mini-games, and unlock content gated by NFT ownership.

### Core Concepts

- **Terminal Interface**: The entire UI is designed to look and feel like an old-school CRT computer terminal (think 1980s green phosphor monitor). It uses the VT323 monospace font, scanline effects, CRT glow, and a blinking cursor.
- **Wallet-Gated Access**: Players connect a Solana wallet (e.g., Solflare) to authenticate. Their game save is tied to their wallet address.
- **NFT-Gated Content**: Certain game paths, items, and locations are gated by ownership of specific NFTs (compressed NFTs / cNFTs).
- **Location-Based Travel**: The game world consists of named locations. Players travel between them by owning cNFTs tagged with a "Location" trait that matches the destination.
- **Persistent Save State**: Game state (current node, inventory, flags, location) is saved to a backend database and auto-saved every 30 seconds.
- **Campaigns & Achievements**: An achievement/campaign system tracks player progress through game states and awards prizes when conditions are met.

---

## 2. Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework, server-side rendering, API routes |
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility CSS (used alongside custom CSS) |
| **VT323 Google Font** | Retro monospace terminal font |
| **Custom CSS** | Extensive hand-crafted terminal styling with CSS variables |
| **@solana/web3.js** | Solana blockchain interaction |
| **@solana/wallet-adapter-react** | Wallet connection UI and hooks |
| **@solana/spl-token** | SPL token (USDC) balance checking |
| **@metaplex-foundation/mpl-bubblegum** | Compressed NFT transfers |
| **@metaplex-foundation/umi** | Metaplex UMI framework for cNFT operations |
| **bs58** | Base58 encoding for wallet signatures |

### Backend (Inferred)
| Technology | Purpose |
|---|---|
| **Node.js / Express** (likely) | REST API server |
| **PostgreSQL** | Database for users, game saves, campaigns, achievements |
| **JWT** | Session token authentication |
| **Helius RPC** | Solana DAS API for fetching cNFTs |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Render.com** | Backend API hosting |
| **Vercel** (likely) | Frontend hosting (Next.js) |
| **Helius** | Solana RPC provider and DAS API |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Next.js Frontend (React)                                │    │
│  │  ┌───────────┐  ┌────────────┐  ┌──────────────────┐   │    │
│  │  │ Terminal   │  │ Game       │  │ Wallet Adapter   │   │    │
│  │  │ UI        │  │ Engine     │  │ (Solflare)       │   │    │
│  │  └───────────┘  └────────────┘  └──────────────────┘   │    │
│  │        │              │                    │             │    │
│  │        ▼              ▼                    ▼             │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │        Next.js API Proxy Routes                  │    │    │
│  │  │  /api/proxy/[...path]    /api/rpc               │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS
                               ▼
        ┌──────────────────────────────────────────────┐
        │           Backend API Server                  │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
        │  │  Auth     │  │  Game    │  │ Campaign │   │
        │  │  Routes   │  │  Routes  │  │ Routes   │   │
        │  └──────────┘  └──────────┘  └──────────┘   │
        │                      │                        │
        │                      ▼                        │
        │  ┌────────────────────────────────────────┐   │
        │  │           PostgreSQL Database           │   │
        │  │  users │ game_saves │ achievements │... │   │
        │  └────────────────────────────────────────┘   │
        └──────────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │         Solana Blockchain (via Helius)        │
        │  cNFT ownership │ wallet verification         │
        └──────────────────────────────────────────────┘
```

### Data Flow

1. User opens the terminal page and connects their Solana wallet.
2. Frontend auto-authenticates by requesting a sign message from the backend, having the wallet sign it, and verifying the signature with the backend.
3. Backend returns a JWT session token.
4. Game engine initializes: loads saved game (or creates new one) via authenticated API calls proxied through Next.js API routes.
5. Game content (nodes, choices, quizzes) is defined entirely in a frontend data file (`game-nodes.ts`). The engine reads nodes locally and renders them.
6. Game state changes (current node, inventory, flags) are periodically saved to the backend.
7. NFT ownership checks happen at specific nodes — the frontend fetches the user's cNFT collection from the backend/Helius and checks for specific NFTs.
8. Campaigns are evaluated server-side whenever game state is saved.

---

## 4. Backend API (Reverse-Engineered)

All API calls go through the Next.js proxy at `/api/proxy/[...path]`, which forwards to the actual backend. The backend base URL pattern is `https://<your-server>/api/v1`.

### 4.1 Authentication Endpoints

#### `POST /api/v1/auth/request-message`
Request a message for the user to sign with their wallet.

**Request Body:**
```json
{
  "wallet_address": "SolanaPublicKeyBase58"
}
```

**Response:**
```json
{
  "message": "Sign this message to authenticate with Crocoverse: <nonce>"
}
```

#### `POST /api/v1/auth/verify-wallet`
Verify a signed message and return a JWT token.

**Request Body:**
```json
{
  "wallet_address": "SolanaPublicKeyBase58",
  "message": "The message that was signed",
  "signature": "Base58EncodedSignature"
}
```

**Response:**
```json
{
  "token": "jwt_session_token",
  "user": {
    "id": "uuid",
    "wallet_address": "SolanaPublicKeyBase58",
    "is_cabal_member": false,
    "is_admin": false
  }
}
```

### 4.2 User Endpoints

#### `GET /api/v1/users/check-wallet?wallet=<address>`
Check if a wallet has an existing user account.

**Response:**
```json
{
  "exists": true
}
```

#### `GET /api/v1/users/profile`
Get the authenticated user's profile. Requires `Authorization: Bearer <token>`.

**Response:**
```json
{
  "id": "uuid",
  "wallet_address": "...",
  "name": "Display Name",
  "is_cabal_member": false,
  "is_admin": false,
  "telegram_username": "...",
  "twitter_username": "...",
  "wallets": ["wallet1", "wallet2"],
  "pfp_image_url": "...",
  "pfp_nft_id": "...",
  "created_at": "2025-01-01T00:00:00Z"
}
```

#### `PUT /api/v1/users/profile`
Update profile fields (name, pfp). Requires auth.

**Request Body:**
```json
{
  "name": "New Name"
}
```
or
```json
{
  "pfp_image_url": "https://...",
  "pfp_nft_id": "nft_mint_address"
}
```

### 4.3 Game Endpoints

#### `GET /api/v1/game/load/<wallet_address>`
Load existing game save for a wallet. Requires auth.

**Response (200):**
```json
{
  "save": {
    "id": 1,
    "user_id": "uuid",
    "wallet_address": "...",
    "current_node_id": "bsri",
    "location": "BSRI",
    "game_state": {
      "bsri_chair_used": "true",
      "bsri_closed": "false",
      "_game_session_start": 1700000000000,
      "quiz_desert_radio_riddle": {
        "attempts": 2,
        "completed": false
      },
      "minigame_results": {
        "snake_godot": {
          "score": 42,
          "recorded_at": 1700000000000
        }
      },
      "game_stats": {
        "snake_godot_score": 42,
        "pimpa_raka_gems": 15
      }
    },
    "inventory": ["Glass of Water", "Sage I Quest Cartridge"],
    "name": "Player Name",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-02T00:00:00Z"
  }
}
```

**Response (404):** No save found (new player).

#### `POST /api/v1/game/new`
Create a new game save. Requires auth. The wallet address comes from the auth token.

**Request Body:**
```json
{
  "starting_node_id": "bsri",
  "name": "Player Name"
}
```

**Response:**
```json
{
  "save": {
    "id": 1,
    "wallet_address": "...",
    "current_node_id": "bsri",
    "location": "BSRI",
    "game_state": {},
    "inventory": [],
    "name": "Player Name",
    "created_at": "..."
  }
}
```

#### `POST /api/v1/game/save`
Save/update game state. Requires auth. **This is the critical endpoint that also triggers campaign/achievement evaluation on the backend.**

**Request Body:**
```json
{
  "current_node_id": "bsri_desert_A3",
  "location": "Desert",
  "game_state": {
    "bsri_chair_used": "true",
    "quiz_desert_radio_riddle": { "attempts": 1, "completed": false },
    "game_stats": { "snake_godot_score": 42 }
  },
  "inventory": ["Glass of Water"],
  "name": "Player Name"
}
```

**Response:**
```json
{
  "save": { ... }
}
```

**Backend Side Effect**: When a save is received, the backend should:
1. Update the game save record.
2. Scan the `game_state` for any new state flags that match campaign `target_states`.
3. Record new achievements in an `achievements` table.
4. Check all active campaigns to see if the user has completed all (or any, depending on `require_all`) required states.
5. Award campaign wins if conditions are met.

#### `POST /api/v1/game/action`
Perform a game action (used for server-side validation in some cases).

**Request Body:**
```json
{
  "action_type": "choice",
  "action_data": {
    "choice_id": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "new_node_id": "next_node",
  "message": "...",
  "effects": { ... }
}
```

> Note: In the current implementation, most game logic runs client-side. The game/action endpoint appears to be available for optional server-side validation but is not heavily used.

#### `GET /api/v1/game/users` (Admin)
List all game users. Requires admin auth.

#### `GET /api/v1/game/metadata` (Admin)
Get game metadata / stats. Requires admin auth.

### 4.4 Campaign Endpoints

#### `GET /api/v1/campaigns`
List all campaigns (active ones shown to players).

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Desert Explorer",
      "description": "Complete the desert quest line",
      "target_states": ["desert_explored", "radio_riddle_solved"],
      "target_value": "true",
      "require_all": true,
      "sets_state": "campaign_desert_complete",
      "max_winners": 50,
      "reward_description": "Limited edition Desert Badge NFT",
      "reward_nft_mint": "...",
      "is_active": true,
      "created_at": "...",
      "updated_at": "...",
      "expires_at": "...",
      "created_by": "admin_wallet",
      "winner_count": 12,
      "is_full": false
    }
  ]
}
```

#### `GET /api/v1/campaigns/<id>`
Get single campaign.

#### `GET /api/v1/campaigns/<id>/leaderboard`
Get campaign winners/leaderboard.

**Response:**
```json
{
  "campaign": { ... },
  "leaderboard": [
    {
      "rank": 1,
      "wallet_address": "...",
      "achieved_at": "...",
      "achieved_state": "...",
      "name": "Player Name",
      "pfp_image_url": "...",
      "pfp_nft_id": "..."
    }
  ]
}
```

#### `GET /api/v1/campaigns/user/progress`
Get the authenticated user's achievement and campaign progress.

**Response:**
```json
{
  "progress": {
    "achievements": [
      {
        "state_name": "bsri_chair_used",
        "state_value": "true",
        "achieved_at": "..."
      }
    ],
    "campaign_wins": [
      {
        "campaign_id": "uuid",
        "campaign_name": "Desert Explorer",
        "rank": 5,
        "reward_description": "...",
        "achieved_at": "..."
      }
    ]
  }
}
```

#### `POST /api/v1/campaigns` (Admin)
Create a new campaign.

#### `PUT /api/v1/campaigns/<id>` (Admin)
Update a campaign.

#### `DELETE /api/v1/campaigns/<id>` (Admin)
Delete a campaign.

#### `POST /api/v1/campaigns/<id>/evaluate` (Admin)
Manually trigger retroactive evaluation for all users against a campaign.

#### `POST /api/v1/campaigns/simulate-achievement` (Admin)
Simulate recording an achievement for testing.

### 4.5 Wallet/Collection Endpoints

#### `GET /api/v1/wallet/<address>/collections`
Get all NFT collections owned by a wallet address.

**Response:**
```json
[
  {
    "collection_id": "CollectionMintAddress",
    "nfts": [
      {
        "id": "nft_mint_address",
        "name": "Sirial #42",
        "data_hash": "...",
        "attributes": [
          { "trait_type": "Location", "value": "Desert" },
          { "trait_type": "Rarity", "value": "Rare" }
        ]
      }
    ]
  }
]
```

### 4.6 NFT Detail Endpoint

#### `GET /api/v1/nft/<id>`
Get detailed information about a specific NFT.

**Response:**
```json
{
  "id": "mint_address",
  "name": "NFT Name",
  "collection_mint": "CollectionMintAddress",
  "data": {
    "compression": {
      "data_hash": "..."
    }
  },
  "image": "https://...",
  "files": [
    { "uri": "https://...", "mime": "image/png" },
    { "uri": "https://...", "mime": "text/plain" }
  ],
  "attributes": [...]
}
```

---

## 5. Database Schema (Inferred)

Based on the API contracts and behavior, the backend database likely has these tables:

### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) NOT NULL UNIQUE,
  name VARCHAR(100),
  is_cabal_member BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  telegram_username VARCHAR(100),
  twitter_username VARCHAR(100),
  pfp_image_url TEXT,
  pfp_nft_id VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `user_wallets` (for multi-wallet support)
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR(44) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `game_saves`
```sql
CREATE TABLE game_saves (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR(44) NOT NULL,
  current_node_id VARCHAR(100) NOT NULL DEFAULT 'bsri',
  location VARCHAR(100) NOT NULL DEFAULT 'BSRI',
  game_state JSONB NOT NULL DEFAULT '{}',
  inventory JSONB NOT NULL DEFAULT '[]',
  name VARCHAR(100) DEFAULT 'Wanderer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address)
);
```

### `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR(44) NOT NULL,
  state_name VARCHAR(200) NOT NULL,
  state_value VARCHAR(200) NOT NULL,
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, state_name)
);
```

### `campaigns`
```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  target_states TEXT[] NOT NULL,       -- Array of game_state keys to check
  target_value VARCHAR(200) DEFAULT 'true', -- Expected value for each state
  require_all BOOLEAN DEFAULT TRUE,    -- TRUE = all states needed, FALSE = any
  sets_state VARCHAR(200),             -- State key set on user when campaign won
  max_winners INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited
  reward_description TEXT NOT NULL,
  reward_nft_mint VARCHAR(44),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_by VARCHAR(44) NOT NULL
);
```

### `campaign_winners`
```sql
CREATE TABLE campaign_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR(44) NOT NULL,
  rank INTEGER NOT NULL,
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, wallet_address)
);
```

### `auth_sessions` (or use stateless JWT)
```sql
-- If using database sessions:
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  wallet_address VARCHAR(44) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 6. Authentication Flow

### Overview

Authentication is based on **Solana wallet message signing**. There are no passwords or OAuth — the wallet IS the identity.

### Step-by-Step Flow

```
1. Frontend calls POST /auth/request-message
   Body: { wallet_address: "..." }
   Response: { message: "Sign this message to authenticate: <random_nonce>" }

2. Frontend uses wallet adapter to sign the message:
   const messageBytes = new TextEncoder().encode(message);
   const signature = await wallet.signMessage(messageBytes);
   const signatureBase58 = bs58.encode(signature);

3. Frontend calls POST /auth/verify-wallet
   Body: { wallet_address: "...", message: "...", signature: "base58sig" }

4. Backend verifies:
   - The signature is valid for the given message and wallet address
   - Uses nacl or tweetnacl to verify ed25519 signature
   - Creates user if not exists
   - Generates JWT token (24-hour expiry)

5. Response: { token: "jwt...", user: { id, wallet_address, is_cabal_member, is_admin } }

6. Frontend stores:
   - sessionStorage: Full session object (token + user + fingerprint + expiry)
   - localStorage: Token for backward compatibility (key: "sessionToken")

7. Subsequent API calls include: Authorization: Bearer <token>

8. Token refresh: Frontend checks every 5 minutes if token expires within 1 hour.
   If so, it re-authenticates silently (re-signs message).
```

### Session Security

The frontend stores a browser fingerprint (user agent + language + timezone + screen size hash) alongside the session. On restore, it verifies the fingerprint matches to prevent session hijacking.

### Auto-Authentication

The `AuthProvider` component wraps the entire app. When a wallet connects, it checks for an existing valid session. If found, it restores it. If not, it automatically initiates the sign-message flow.

---

## 7. Frontend Architecture

### Directory Structure

```
src/
├── app/
│   ├── terminal/
│   │   ├── page.tsx              # Route: /terminal
│   │   ├── CrocTerminal.tsx      # Main terminal component (~1600 lines)
│   │   ├── croc-terminal.css     # Terminal-specific styles
│   │   └── components/
│   │       ├── Monitor.tsx        # CRT monitor display widget
│   │       ├── StatsBox.tsx       # Player stats / campaign progress
│   │       ├── InventoryBox.tsx   # Visual inventory grid
│   │       ├── LocationsBox.tsx   # Location navigator with icons
│   │       ├── TypingLine.tsx     # Per-character typing animation
│   │       └── CampaignProgressIndicator.tsx
│   ├── api/
│   │   ├── proxy/[...path]/route.ts  # API proxy
│   │   └── rpc/route.ts              # Solana RPC proxy
│   └── providers.tsx                  # App-wide providers
├── components/
│   └── terminal/
│       ├── SnakeGame.tsx         # Built-in Snake mini-game
│       ├── PongGame.tsx          # Built-in Pong mini-game
│       └── IframeGame.tsx        # Godot game iframe wrapper
├── context/
│   └── AuthProvider.tsx          # Wallet auth context
├── data/
│   ├── game-nodes.ts            # ALL game content (~5300 lines)
│   └── game-content.ts          # Re-export wrapper
├── lib/
│   ├── game-engine.ts           # Core game engine class (~1650 lines)
│   ├── game-api.ts              # Game API client (load/save/new/action)
│   ├── game-utils.ts            # Node lookup helpers
│   ├── game-items.ts            # Dynamic item extraction from nodes
│   ├── terminal-commands.ts     # Terminal command handlers (~960 lines)
│   ├── campaign-api.ts          # Campaign CRUD API client
│   ├── api.ts                   # Main API client with fetchWithAuth
│   ├── sirials-helius.ts        # cNFT fetching via Helius DAS API
│   ├── cnft-transfer.ts         # cNFT transfer logic
│   └── types/
│       └── game.ts              # GameNode interface, LOCATIONS const
├── styles/
│   └── terminal-themes.css      # Theme color variables
└── public/
    └── games/
        ├── snake/               # Godot Snake game (HTML5 export)
        ├── pimpa-raka/          # Godot Pimpa & Raka game
        └── _GODOT/              # Shared Godot runtime files
```

### Key Component: `CrocTerminal.tsx`

This is the main component (~1600 lines). It manages:

- **Terminal output buffer**: Array of `{ text, isUser, className, link, timestamp }` objects rendered as lines.
- **Input handling**: Text input at the bottom, processes commands and game choices.
- **Game engine instance**: Holds a `GameEngine` ref that manages all game logic.
- **Wallet integration**: Uses `useWallet()` and `useAuth()` hooks.
- **Side panels**: Locations, Stats/Campaigns, Inventory, and a CRT Monitor.
- **Mini-game overlays**: Snake, Pong, and Godot iframe games that overlay the terminal.
- **Multi-step flows**: Transfer confirmations, profile updates, username changes.
- **Mobile sidebar**: Swipe-to-open sidebar for side panels on mobile.

### Provider Hierarchy

```tsx
<ConnectionProvider endpoint={rpcProxy}>
  <WalletProvider wallets={[solflare]}>
    <WalletModalProvider>
      <AuthProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </AuthProvider>
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

---

## 8. Game Engine

The `GameEngine` class (`src/lib/game-engine.ts`) is the heart of the game logic. It runs entirely client-side.

### Constructor Callbacks

```typescript
class GameEngine {
  constructor(
    outputFn: (text: string, className?: string, link?: string) => void,
    locationChangeFn?: (location: string) => void,
    getUserNameFn?: () => string | null,
    setUserNameFn?: (name: string) => void,
    displayNftInMonitorFn?: (nftId: string) => void,
    inventoryChangeFn?: (items: Array<{id: string, name: string, quantity?: number}>) => void,
    miniGameStartFn?: (gameId: string) => void
  )
}
```

### Game State Shape

```typescript
interface GameSave {
  id?: number;
  user_id?: string;
  wallet_address: string;
  current_node_id: string;      // Which node the player is on
  location: string;             // Current location name
  game_state: Record<string, any>; // Arbitrary key-value flags
  inventory: string[];          // Array of item name strings
  name?: string;                // Player display name
  created_at?: string;
  updated_at?: string;
}
```

### Lifecycle

1. **`initialize(walletAddress)`**: Loads existing save or starts new game.
2. **`processInput(input)`**: Main input handler — routes to choices, commands, quiz answers, travel, etc.
3. **`displayCurrentNode()`**: Renders the current node's content and choices.
4. **`moveToNode(nodeId)`**: Transitions to a new node, applies effects, auto-saves.
5. **`autoSave()`**: Persists current state to backend (also runs on a 30-second timer).
6. **`destroy()`**: Cleans up timers and performs final save.

### Requirements System

Choices can have requirements that must be met to be visible:

```typescript
requirements: {
  has_item: ["Item Name"],           // Player must have this item
  has_item_negate: [true],           // Invert: player must NOT have item
  state: { "flag_name": "true" },    // Game state must match
  has_nft: "nft_mint_address",       // Must own specific NFT
  has_nft_negate: true               // Invert: must NOT own NFT
}
```

### Effects System

Nodes can apply effects when arrived at:

```typescript
effects: {
  add_item: ["New Item"],           // Add to inventory
  remove_item: ["Old Item"],        // Remove from inventory
  set_state: { "flag": "true" }     // Set game state flags
}
```

### Template System

Node content supports `{{state.path.to.value}}` placeholders that are replaced with values from the current `game_state` at render time. This allows dynamic text like "Your score is {{state.game_stats.snake_score}}".

---

## 9. Game Node System

### Node Type Interface

```typescript
interface GameNode {
  id: string;
  type: 'story' | 'choice' | 'puzzle' | 'nft_check' | 'item_check' | 'location' | 'quiz' | 'godot_game';
  content: string;                    // Main narrative text (supports \n and {{}} templating)
  location?: string;                  // Which game location this node belongs to
  choices?: Array<{
    id: number;
    text: string;
    next_node: string;
    requirements?: Record<string, any>;
  }>;
  effects?: {
    add_item?: string[];
    remove_item?: string[];
    set_state?: Record<string, any>;
  };
  next_node?: string;                 // For linear progression
  requires_sirial?: string;           // Location name required on owned cNFT

  // NFT Check specific
  nft_id?: string;                    // NFT mint address to check
  item_name?: string;                 // Item granted on ownership
  nft_owned_content?: string;         // Narrative when NFT is owned
  nft_missing_content?: string;       // Narrative when NFT is not owned
  nft_owned_next_node?: string;
  nft_missing_next_node?: string;

  // Quiz specific
  question?: string;
  correct_answer?: string | number;
  hint?: string;
  hint_visible?: boolean;
  hint_requirements?: Record<string, any>;
  success_node?: string;
  failure_node?: string;
  exit_node?: string;
  max_attempts?: number;              // null = infinite
  success_message?: string;
  failure_messages?: string[];        // Indexed by attempt number
  final_failure_message?: string;
  success_effects?: { add_item?: string[]; remove_item?: string[]; set_state?: Record<string, any> };
  failure_effects?: { add_item?: string[]; remove_item?: string[]; set_state?: Record<string, any> };

  // Godot Game specific
  game_id?: string;                   // Matches postMessage payload
  start_prompt?: string;
  end_event?: string;                 // Default: "game_over"
  end_message?: string;               // Supports {{metrics.score}} etc.
  payload_messages?: Record<string, string>;
  payload_store?: {
    mode: 'last' | 'history';
    state_key?: string;
  };
  payload_state_map?: Record<string, {
    state_key: string;
    mode?: 'set' | 'increment';
    multiplier?: number;
    round?: 'floor' | 'ceil' | 'round';
  }>;
  payload_rules?: Array<{
    when?: {
      event?: string;
      metric?: string;
      op?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists';
      value?: number;
    };
    effects?: { add_item?: string[]; remove_item?: string[]; set_state?: Record<string, any> };
    increment_state?: Record<string, number>;
    message?: string;
    next_node?: string;
  }>;
}
```

### Node Types Explained

#### `story` — Basic narrative
The most common type. Shows content text, optionally followed by numbered choices or a "Press ENTER to continue" prompt.

#### `location` — Travel destination
Used as the entry point for each named location. The `location` field determines the location name. Players travel here via the `travel` command. Non-hub locations require the player to own a cNFT with a matching "Location" trait.

#### `nft_check` — NFT ownership gate
Checks if the player owns a specific NFT (by mint address). If yes, grants an item and shows owned-path narrative. If no, shows a different narrative. Can branch to different next_nodes based on ownership.

#### `quiz` — Question/answer
Presents a question the player must answer by typing. Supports configurable max attempts (or infinite), hints (optionally gated by requirements), success/failure effects, and routing to different nodes on success vs failure.

#### `godot_game` — Embedded Godot mini-game
Launches an HTML5 Godot game in an iframe. Communicates via `postMessage`. The engine listens for game events, maps metrics to game state, applies rules for conditional routing, and stores results.

### NFT References in Text

Content can include inline NFT references using the syntax `[NFT:<mint_address>|<display_name>]`. The frontend parses these and renders them as clickable links that open an NFT detail modal.

### Locations

The game world has these defined locations (customize for your collection):

```typescript
const LOCATIONS = [
  'BSRI',           // Starting hub — always accessible
  'Apothecary', 'Arcade', 'Aviary', 'Barbershop',
  'Casa Azul', 'Casino', "Croc A' Duck Espresso",
  'Desert', 'Graveyard', 'Grove', 'Swamp',
  'HQ', 'PTP', 'Pawn Shop', 'Quarry',
  'Robotix', 'Saloon', 'Sirius Dealz', 'Stadium'
];
```

### Travel Logic

1. Player types `travel to <location>` or `go <location>`.
2. If destination is the hub (BSRI), always allowed.
3. Otherwise, fetch player's owned cNFTs via Helius DAS API.
4. Check if any cNFT has `trait_type: "Location"` matching the destination, OR `value: "Universal"` (wildcard access).
5. If access granted, move to the location's entry node.
6. If denied, show "You need a [cNFT] with the [Location] location to travel there."

---

## 10. Terminal UI Components

### Terminal Output

The main terminal area is a scrollable div displaying an array of output lines. Each line has:
- `text`: The content string
- `isUser`: Boolean — user input lines are styled differently (dimmer color)
- `className`: Optional Tailwind/custom class for coloring (e.g., `text-yellow-400`, `text-cyan-400`, `text-green-400`, `text-red-400`, `quiz-question`)
- `link`: Optional link target (for clickable text)

Lines animate in with a `typeIn` CSS animation (slide from left + fade in).

### Typing Animation (`TypingLine`)

A per-character typing animation component that reveals text character by character with configurable speed. Each character gets a brief glow effect as it appears. Configurable via CSS variables:

```css
--typing-speed-ms: 2;              /* Base speed per character */
--typing-variation: 1;              /* Random variation factor */
--glow-duration-ms: 750;            /* Per-character glow duration */
--glow-blur-start: 12px;            /* Initial glow blur */
--glow-brightness-start: 1.3;       /* Initial brightness boost */
```

### Input Area

A styled text input at the bottom of the terminal with:
- A `>_` prompt symbol
- Autocomplete suggestions (ghost text showing available commands)
- Tab completion support

### Side Panel (Desktop: Right Column / Mobile: Slide-out Sidebar)

#### Monitor
A small CRT-style display that:
- Shows looping ambient video by default
- Can display NFT images (for `view` command)
- Has scanline and CRT curvature overlay effects

#### Locations Box
Shows the player's current location with a pixel art icon. Arrow buttons let users browse through all locations. Each location shows an icon, name, and count badge showing how many cNFTs the player owns for that location. Owned locations have a glowing icon; unowned ones are grayed out.

#### Stats Box
Displays:
- Player name and avatar (from profile)
- NFT collection counts (how many cNFTs owned)
- Active campaign progress with visual dot indicators
- Campaign leaderboard position
- A "CLI Anim" toggle to enable/disable typing animations

#### Inventory Box
A 2-column grid of inventory slots showing pixel art icons for each item. Items can be clicked for descriptions. Newly obtained items get a blink highlight animation. Paginated with arrow navigation.

---

## 11. Visual Design & Styling

### Design Philosophy

The entire UI emulates a **1980s CRT computer terminal**. Every element uses the retro aesthetic consistently:

### Font

```css
font-family: 'VT323', monospace;
```

Loaded from Google Fonts. This is a pixel-style monospace font that looks like old terminal text.

### Color Themes

Three selectable color themes, all using CSS custom properties:

#### Theme 1 — Classic Green (Default)
```css
--primary-color: #2dfe39;    /* Bright green */
--primary-rgb: 45, 254, 57;
--primary-dim: #1fb527;      /* Darker green for secondary text */
--primary-dark: #158c1d;
--primary-light: #5fff66;    /* Lighter green for highlights */
```

#### Theme 2 — Tron Blue
```css
--primary-color: #00d9ff;    /* Cyan blue */
--primary-rgb: 0, 217, 255;
--primary-dim: #0099cc;
--primary-dark: #006688;
--primary-light: #66e5ff;
```

#### Theme 3 — Knight Rider Red
```css
--primary-color: #ff0040;    /* Bright red */
--primary-rgb: 255, 0, 64;
--primary-dim: #cc0033;
--primary-dark: #990025;
--primary-light: #ff6690;
```

Themes are applied by setting `data-theme="2"` or `data-theme="3"` on the `<html>` element. Theme 1 is the default (no attribute).

### Background & Containers

```css
background: #0a0a0a;         /* Near-black page background */
/* Containers: */
background: #1a1a1a;         /* Slightly lighter dark */
border: 3px solid var(--primary-color);
border-radius: 10px;
box-shadow: 0 0 20px var(--primary-glow);
```

### CRT Effects

#### Scanlines
Every container has a `::before` pseudo-element with animated scanlines:

```css
background: linear-gradient(
  rgba(primary, 0.03) 50%,
  rgba(0, 0, 0, 0.3) 50%
);
background-size: 100% 4px;
animation: scanlines 10s linear infinite;
```

#### CRT Glow on Monitor
```css
.monitor-screen::before {
  background:
    radial-gradient(ellipse at center, rgba(primary, 0.15) 0%, transparent 70%),
    /* scanlines */;
}
.monitor-screen::after {
  /* Vignette effect */
  background: radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%);
}
```

### Animations

- **`typeIn`**: Slides text in from the left with fade (`0.5s ease-out`)
- **`blink`**: Cursor blinking animation (`1s infinite`)
- **`quiz-glitch`**: Intermittent RGB split glitch effect on quiz questions (`8.5s infinite`)
- **`glitch`**: More aggressive glitch for special effects
- **`pulse-glow`**: Gentle glow pulsing for completed campaign dots
- **`blink-completion`**: Celebratory blink for newly completed achievements
- **`inventoryBlink`**: Highlight animation for newly acquired items
- **`subtle-flicker`**: CRT flicker simulation
- **`cursor`**: Terminal cursor blink

### Terminal Output Line Styles

```css
.terminal-line {
  font-size: 22px;
  line-height: 1.4;
  white-space: pre-wrap;
  animation: typeIn 0.5s ease-out;
}
```

### Game Choice Styles

```css
.game-choice {
  cursor: pointer;
  transition: all 0.2s ease;
}
.game-choice:hover {
  background: rgba(var(--primary-rgb), 0.1);
  padding-left: 10px;  /* Indent on hover */
}
```

### Scrollbar Styling

Custom CRT-themed scrollbars:
```css
::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 5px;
}
```

---

## 12. Wallet & Blockchain Integration

### Wallet Connection

Uses `@solana/wallet-adapter-react` with Solflare as the primary wallet. The wallet adapter provides:

- `useWallet()` hook: `publicKey`, `connected`, `signMessage`, `disconnect`
- `useWalletModal()` hook: `setVisible()` to show wallet selection modal
- `useConnection()` hook: Solana RPC connection

### RPC Proxy

All Solana RPC calls go through `/api/rpc` to:
1. Hide the Helius API key
2. Whitelist allowed RPC methods
3. Handle CORS

Allowed RPC methods include: `getAccountInfo`, `getBalance`, `searchAssets`, `getAsset`, `getAssetProof`, `getLatestBlockhash`, `sendTransaction`, etc.

### cNFT Fetching (Helius DAS API)

The `fetchOwnedSirials(walletAddress)` function uses Helius's `searchAssets` RPC method to find all compressed NFTs owned by a wallet that belong to a specific collection:

```typescript
// Pseudocode
const response = await heliusRpc.searchAssets({
  ownerAddress: walletAddress,
  grouping: ["collection", COLLECTION_MINT_ADDRESS],
  compressed: true,
  page: 1,
  limit: 1000
});
```

Each cNFT has:
- `id`: Asset ID / mint address
- `name`: Display name (e.g., "Sirial #42")
- `attributes`: Array of `{ trait_type, value }` — especially "Location"
- `files`: Array of associated files (PNG images, GIF animations, text art)
- `image`: Primary image URL
- `owner`: Wallet address of current owner

### cNFT Transfers

The system supports transferring cNFTs between wallets using Metaplex Bubblegum:

```typescript
// Uses UMI framework
const umi = createUmi(rpcUrl);
// Fetches asset proof, constructs Bubblegum transfer instruction
await transferCNFT(connection, wallet, assetId, recipientAddress);
```

---

## 13. NFT Ownership Gating

### Location Gating

When a player tries to travel to a non-hub location:

1. Fetch player's owned cNFTs.
2. Check if any cNFT has `{ trait_type: "Location", value: "<destination>" }` or `{ trait_type: "Location", value: "Universal" }`.
3. Allow or deny travel.

### Item Gating (`nft_check` nodes)

When the game engine encounters an `nft_check` node:

1. Fetch the NFT details from backend (to get `collection_mint` and `data_hash`).
2. Fetch the player's wallet collections.
3. Search for the specific NFT by ID or by `data_hash` (for compressed NFTs where the ID might differ).
4. If found: grant the item to inventory, show success narrative, route to `nft_owned_next_node`.
5. If not found: show failure narrative with a clickable "Reveal required NFT" link, route to `nft_missing_next_node`.

### Choice Gating

Individual choices can require NFT ownership via `requirements.has_nft`. Choices with unmet requirements are hidden from the player.

---

## 14. Campaign / Achievement System

### How It Works

1. **Campaigns** are admin-created challenges with `target_states` — an array of game state keys players must achieve.
2. When a player's game state is saved to the backend, the backend scans for new state values.
3. New states are recorded as **achievements** with timestamps.
4. The backend then checks all active campaigns to see if the player has achieved all required states (if `require_all: true`) or any required state (if `require_all: false`).
5. If conditions are met and the campaign has available winner slots, the player is awarded a **campaign win** with a rank.
6. Optionally, a `sets_state` flag is written back to the user's game state.

### Frontend Display

The `StatsBox` component shows:
- Active campaign name and description
- Progress dots (one per `target_state`, filled when achieved)
- Winner slots bar (showing filled/total slots)
- Countdown timer for campaigns with expiry dates
- Completed campaign badges (pixel art images from `reward_nft_mint`)

### Achievement Tracking on Save

The game state uses string flags like `"true"` / `"false"`. When the backend receives a save, it should:

```
For each key in game_state:
  If key matches any campaign's target_states AND value matches target_value:
    Record achievement (state_name, state_value, timestamp)
    For each active campaign containing this state:
      Check if user has ALL required states (or ANY, per require_all)
      If met AND winner_count < max_winners:
        Award campaign win (increment winner_count, record rank)
```

---

## 15. Embedded Mini-Games (Godot)

### Architecture

Godot games are exported as HTML5 and served as static files from `/public/games/<game-id>/`. They run inside an iframe managed by the `IframeGame` component.

### Communication Protocol

Games communicate with the parent page via `postMessage`:

#### Game → Parent (game events)
```json
{
  "type": "game_event",
  "event": "game_over",        // or "exit", "checkpoint", etc.
  "game_id": "snake_godot",
  "metrics": {
    "score": 42,
    "gems": 5,
    "diamonds": 2
  },
  "time_seconds": 120.5
}
```

#### Parent → Game (host requests)
```json
{
  "type": "host_request",
  "action": "request_exit"
}
```

### Godot Game Node Configuration

```typescript
{
  type: "godot_game",
  game_id: "snake_godot",           // Must match postMessage game_id
  location: "Arcade",
  next_node: "arcade_games",        // Default next node after game
  end_event: "game_over",           // Which event ends the game (default)
  end_message: "Game over! Score: {{metrics.score}}",
  
  // Store raw payloads in game_state
  payload_store: {
    mode: "last",                    // or "history" for array
    state_key: "game_payloads.snake_godot"
  },
  
  // Map metrics to persistent game state
  payload_state_map: {
    "score": {
      state_key: "game_stats.snake_godot_score",
      mode: "set"                    // or "increment" for cumulative
    },
    "gems": {
      state_key: "game_stats.snake_gems",
      mode: "increment",
      multiplier: 1
    }
  },
  
  // Conditional routing based on metrics
  payload_rules: [
    {
      when: { event: "game_over", metric: "score", op: "gte", value: 100 },
      message: "Amazing! You scored {{metrics.score}}! The arcade master is impressed.",
      effects: { set_state: { "snake_high_score": "true" } },
      next_node: "arcade_snake_champion"
    },
    {
      when: { event: "game_over" },
      message: "You scored {{metrics.score}}. Better luck next time!",
      // No next_node — falls through to default
    }
  ]
}
```

### Mini-Game Flow

1. Player arrives at a `godot_game` node.
2. Engine sets up a "minigame gate" (status: `ready`).
3. The terminal displays any start prompt.
4. When player presses Enter, status becomes `running` and the iframe game launches.
5. During gameplay, game events arrive via postMessage. The engine processes them (stores payloads, maps state, evaluates rules).
6. When the end event arrives (e.g., `game_over` or `exit`), the engine:
   - Applies final state mapping and rules
   - Records results in `game_state.minigame_results`
   - Marks the gate as `complete`
   - Closes the iframe
   - Shows "Press ENTER to continue"
7. On Enter, the engine moves to the next node (possibly overridden by a rule).

### Building Godot Games for This System

Your Godot game needs to:
1. Export as HTML5.
2. Send `postMessage` events with `{ type: "game_event", event: "...", game_id: "...", metrics: {...}, time_seconds: N }`.
3. Listen for `{ type: "host_request", action: "request_exit" }` and respond with an `exit` event.
4. Send `game_over` when the game naturally ends.

---

## 16. Terminal Commands

The terminal supports typed commands alongside the game. Commands are processed by the `commands` object in `terminal-commands.ts`.

### Available Commands

| Command | Description |
|---|---|
| `help` | Show all available commands |
| `about` | About the system |
| `connect` | Open wallet connection dialog |
| `disconnect` | Disconnect wallet |
| `profile` | View user profile (triggers auth if needed) |
| `profile create` | Create a new user profile |
| `name` | View current display name |
| `name <text>` | Set display name (with confirmation) |
| `pfp` | Set profile picture from owned cNFTs |
| `pfp clear` | Remove profile picture |
| `theme` | Show available themes |
| `theme 1/2/3` | Switch color theme |
| `list` | List all cNFTs in connected wallet |
| `list <#>` | Show details for cNFT by number |
| `list <wallet>` | List cNFTs in another wallet |
| `view <#>` | Display cNFT image on monitor + ASCII art |
| `owner <#>` | Show who owns a specific cNFT |
| `transfer` | Transfer a cNFT to another wallet |
| `orders` | View purchase orders (requires auth) |
| `clear` | Clear terminal output |
| `glitch` | Activate glitch visual effect |
| `pattern` | Change monitor display pattern |

### Game-Specific Commands

| Command | Description |
|---|---|
| `[number]` | Make a choice in current game node |
| `ENTER` | Continue (linear progression) |
| `travel to <loc>` / `go <loc>` | Travel to a location |
| `map` | Show all available locations |
| `look` / `l` | Re-display current scene |
| `inventory` / `i` | Show inventory |
| `save` | Manual save |
| `load` | Reload saved game |
| `restart` | Restart game (with confirmation) |

### Secret Commands

Some nodes have hidden commands that are only available at specific locations:
- At "robotix" node: `give me the oil` → triggers secret path
- At "bsri" node: `find the postcard` → triggers secret discovery

### Command Processing Priority

When input is received:
1. Check for `restart` command (always available).
2. Check for secret location-specific commands.
3. Check for `travel to` / `go to` / `go` prefixed commands.
4. Check for game commands (`save`, `load`, `inventory`, `help`, `map`, `look`).
5. Check for minigame gate state (Enter to start/continue).
6. Check for quiz answer mode.
7. Process numbered choices.
8. Process Enter for linear progression.
9. Fall through to terminal commands (`help`, `connect`, `theme`, etc.).

---

## 17. Mobile Responsive Design

### Layout

- **Desktop (>768px)**: Two-column layout. Terminal on the left (flex: 1), side panel (250px) on the right containing Locations, Stats, Inventory, and Monitor.
- **Mobile (≤768px)**: Full-width terminal. Side panel becomes a slide-out sidebar from the right edge, toggled by a hamburger button.

### Mobile Sidebar

```
┌──────────────────────────────┐
│  Terminal (full width)     [≡]│  ← hamburger button
│                               │
│  Story text...                │     ┌──────────┐
│  [1] Choice 1                 │ ──► │ Sidebar  │
│  [2] Choice 2                 │     │          │
│                               │     │ Locations│
│  >_ input                     │     │ Stats    │
│                               │     │ Inventory│
└──────────────────────────────┘     │ Monitor  │
                                      └──────────┘
```

Features:
- Swipe-from-right to open sidebar
- Overlay background dims the terminal
- Touch-friendly button sizes
- Sidebar auto-closes when interacting with terminal
- Notification dot on hamburger when inventory changes

### Key Mobile CSS

```css
@media (max-width: 768px) {
  .retro-container {
    flex-direction: column;
    padding: 0;
    height: 100dvh;
  }
  .terminal-section {
    flex: 1;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  .monitor-section { display: none; }
  .sidebar-toggle { display: flex; }
  .mobile-sidebar { display: flex; }
}
```

---

## 18. API Proxy Layer

### Purpose

The Next.js API proxy (`/api/proxy/[...path]`) serves three purposes:
1. **CORS handling**: The browser can't directly call the backend due to CORS.
2. **API key protection**: The `X-API-Key` and `API_BASE_URL` are server-side only.
3. **Security**: Only whitelisted API paths are allowed.

### Implementation

```typescript
// /api/proxy/[...path]/route.ts
const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

const ALLOWED_PATHS = [
  'auth/request-message', 'auth/verify-wallet',
  'users/check-wallet', 'users/profile',
  'game/new', 'game/load', 'game/save', 'game/action',
  'game/users', 'game/metadata',
  'campaigns', 'campaigns/simulate-achievement', 'campaigns/user/progress',
  'wallet',
  // ... more paths
];

// For each method (GET, POST, PUT, DELETE):
// 1. Validate path against allowlist
// 2. Forward auth headers (Authorization, X-Internal-Token)
// 3. Add X-API-Key header
// 4. Proxy to backend
// 5. Return response (with cache control)
```

### Caching

- Game and race endpoints: `Cache-Control: no-store`
- Other endpoints: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`

---

## 19. Deployment & Environment

### Environment Variables

```env
# Backend API
API_BASE_URL=https://your-backend-server.com/api/v1
API_KEY=your-api-key

# Solana RPC (Helius)
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# Or use the RPC proxy (recommended):
NEXT_PUBLIC_RPC_URL=/api/rpc

# Public
NEXT_PUBLIC_API_URL=https://your-backend-server.com/api/v1
```

### Build & Run

```bash
npm install
npm run dev     # Development on localhost:3000
npm run build   # Production build
npm run start   # Start production server
```

---

## 20. Recreating This Project

### Step-by-Step Guide for Another Collection

#### 1. Backend API Server

Build a REST API with these endpoints:

- **Auth**: `POST /auth/request-message`, `POST /auth/verify-wallet`
  - Use `@solana/web3.js` + `tweetnacl` to verify ed25519 signatures
  - Generate JWT tokens (24hr expiry)
  - Create user on first auth

- **Users**: `GET /users/check-wallet`, `GET /users/profile`, `PUT /users/profile`

- **Game**: `GET /game/load/:wallet`, `POST /game/new`, `POST /game/save`
  - Store saves as wallet_address → JSONB (game_state, inventory, current_node, location)
  - On save: scan game_state for achievement triggers, evaluate campaigns

- **Campaigns**: Full CRUD + `GET /campaigns/user/progress`, `GET /campaigns/:id/leaderboard`
  - Achievement tracking: record state changes with timestamps
  - Campaign evaluation: check if user's achievements satisfy target_states

- **Wallet/NFT**: `GET /wallet/:address/collections`
  - Use Helius DAS API (`searchAssets`) to fetch owned cNFTs
  - Return structured collection data with attributes

Use PostgreSQL with the schema outlined in Section 5.

#### 2. Frontend — Next.js App

1. Set up Next.js 14 with App Router, TypeScript, Tailwind.
2. Install wallet adapter packages:
   ```
   @solana/web3.js @solana/wallet-adapter-base
   @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
   @solana/wallet-adapter-wallets
   ```
3. Create the provider hierarchy (Connection → Wallet → Auth).
4. Build the API proxy route (`/api/proxy/[...path]`).
5. Build the RPC proxy route (`/api/rpc`).

#### 3. Game Engine

Port the `GameEngine` class. Key behaviors:
- Load/save via API
- Process input (choices, commands, travel, quiz answers)
- Requirements checking (items, state flags, NFT ownership)
- Effects application (add/remove items, set state)
- Template rendering (`{{state.key}}` in content)
- Auto-save on node transitions and 30-second timer
- NFT ownership cache

#### 4. Game Content

Create your `game-nodes.ts` — a `Record<string, GameNode>` with all your story content. Follow the style guide:
- Unique string IDs (lowercase, underscore-separated)
- Second-person present tense narrative
- Short paragraphs (1-3 sentences)
- State-driven variants to avoid repetition
- Use `effects.set_state` to track player progress

#### 5. Terminal UI

Build the CRT terminal interface:
- VT323 font from Google Fonts
- Dark backgrounds (#0a0a0a, #1a1a1a)
- CSS variable-based theming (3 color schemes)
- Scanline overlay animation on all containers
- Per-character typing animation with glow
- Scrollable terminal output area
- Styled input prompt with autocomplete

#### 6. Side Panels

- **Locations**: Show icons for each game location with owned/unowned state
- **Stats**: Player info + campaign progress dots
- **Inventory**: Grid of pixel art item icons
- **Monitor**: CRT screen with ambient video / NFT image display

#### 7. cNFT Integration

- Use Helius DAS API to fetch collection data
- Map cNFT attributes (especially "Location") to game mechanics
- Implement NFT ownership checks for gated content
- Support `nft_check` nodes and `has_nft` requirements

#### 8. Mini-Games (Optional)

- Export Godot games as HTML5
- Host in `/public/games/`
- Implement `IframeGame` component with postMessage communication
- Define `godot_game` nodes with payload mapping configuration

#### 9. Campaigns

- Build admin UI for creating/managing campaigns
- Implement backend achievement tracking on game save
- Show campaign progress in the Stats panel
- Support leaderboards and limited winner slots

### Key Design Decisions to Preserve

1. **Game content is frontend-only**: All nodes, choices, and narrative are in a static TypeScript file. The backend only stores player state, not game content. This makes content updates instant (no backend deploy needed).

2. **Client-side game engine**: The engine runs in the browser. The backend is a dumb persistence layer for saves and achievements. This keeps the game fast and responsive.

3. **Wallet = Identity**: No passwords, no email. The Solana wallet IS the user account. Authentication is just signature verification.

4. **NFT-gated travel**: This is the core loop — collect NFTs to unlock new game areas. Make sure your collection has a "Location" (or similar) trait that maps to game locations.

5. **Auto-save aggressively**: Save on every node transition and every 30 seconds. Players should never lose progress.

6. **Proxy everything**: Never expose backend URLs or API keys to the browser. Use Next.js API routes as a proxy layer.

7. **Theme everything with CSS variables**: The three-theme system is elegant and easily extensible. All colors derive from `--primary-color` and `--primary-rgb`.

---

## Appendix A: Terminal Color Reference

| CSS Class | Color | Usage |
|---|---|---|
| `text-white` | Theme primary color | Story narrative text |
| `text-yellow-400` | Yellow | Prompts, warnings, item notifications |
| `text-cyan-400` | Cyan | Choices, UI headers |
| `text-green-400` | Green | Success messages, game loaded |
| `text-red-400` | Red | Errors, failures, access denied |
| `text-gray-400` | Gray | Hints, secondary information |
| `text-gray-500` | Dark gray | Dividers, subtle elements |
| `quiz-question` | Theme + glitch animation | Quiz questions |

> Note: `text-white` is overridden in terminal context to use the theme's primary color instead of actual white, keeping the monochrome aesthetic.

## Appendix B: postMessage Protocol for Godot Games

### From Game to Host
```typescript
// Game sends:
window.parent.postMessage(JSON.stringify({
  type: "game_event",
  event: "game_over",      // "game_over" | "exit" | "checkpoint" | custom
  game_id: "your_game_id", // Must match node's game_id
  metrics: {               // Arbitrary numeric metrics
    score: 42,
    gems: 5
  },
  time_seconds: 120.5      // Total play time
}), "*");
```

### From Host to Game
```typescript
// Host sends:
iframe.contentWindow.postMessage({
  type: "host_request",
  action: "request_exit"   // Ask game to clean up and send exit event
}, window.location.origin);
```

## Appendix C: Game State Convention

Game state keys follow a convention:

- `<location>_<flag>`: Location-specific flags (e.g., `bsri_chair_used`, `desert_explored`)
- `quiz_<node_id>`: Quiz attempt tracking (auto-managed by engine)
- `minigame_results.<game_id>`: Raw mini-game results (auto-managed)
- `game_stats.<metric>`: Cumulative game statistics from Godot games
- `game_payloads.<game_id>`: Raw Godot payloads (if `payload_store` is configured)
- `_game_session_start`: Session start timestamp (auto-set on new game)
- `campaign_<name>_complete`: Set by campaigns on win (via `sets_state`)

All flag values are stored as strings: `"true"` or `"false"`. Missing keys are treated as `"false"` in requirement checks.
