# Complete Terminal Text Adventure Game - Cursor AI Build Prompt

## 🎯 Project Overview

Build a retro CRT terminal-themed text adventure game that runs in the browser. The game is gated by Solana compressed NFT (cNFT) ownership, with persistent cloud saves, achievement tracking, and embedded mini-games.

**Reference Document**: Use the "Terminal Text Adventure Game — Complete Architecture Document" as your complete technical specification.

---

## 📋 Build Order & Implementation Plan

Follow this sequence to build the entire system:

### Phase 1: Database & Backend Foundation (Steps 1-3)
### Phase 2: Authentication & User System (Steps 4-5)  
### Phase 3: Game Save System (Steps 6-7)
### Phase 4: Campaign/Achievement System (Step 8)
### Phase 5: Frontend Foundation (Steps 9-11)
### Phase 6: Game Engine & Terminal UI (Steps 12-14)
### Phase 7: NFT Integration (Step 15)
### Phase 8: Mini-Games & Polish (Steps 16-17)

---

## 🔧 STEP 1: Database Schema Setup

**Task**: Create PostgreSQL database with complete schema.

**Instructions**:
1. Create a new PostgreSQL database named `terminal_game_db`
2. Implement ALL tables from Section 5 of the architecture document:
   - `users` - User accounts linked to wallet addresses
   - `user_wallets` - Multi-wallet support
   - `game_saves` - Player game state storage
   - `achievements` - Individual achievement tracking
   - `campaigns` - Admin-created challenges
   - `campaign_winners` - Campaign completion records

**Schema Requirements**:
```sql
-- Core tables with proper indexes, foreign keys, and constraints
-- Use JSONB for game_state and inventory in game_saves
-- Add updated_at triggers for timestamp management
-- Include unique constraints on wallet_address fields
-- Add indexes on foreign keys and frequently queried fields
```

**Deliverables**:
- `database/schema.sql` - Complete schema definition
- `database/migrations/001_initial_schema.sql` - Migration file
- `database/seed.sql` - Sample data for testing (optional)

---

## 🔧 STEP 2: Backend API Server Setup

**Task**: Initialize Node.js/Express backend with project structure.

**Tech Stack**:
- Node.js with Express
- TypeScript
- PostgreSQL with `pg` driver
- JWT for authentication
- `@solana/web3.js` for wallet verification
- `tweetnacl` for signature verification
- `dotenv` for environment variables

**Project Structure**:
```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts        # PostgreSQL connection pool
│   │   └── constants.ts       # API keys, collection address
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification middleware
│   │   └── errorHandler.ts   # Global error handling
│   ├── routes/
│   │   ├── auth.routes.ts     # Authentication endpoints
│   │   ├── users.routes.ts    # User profile endpoints
│   │   ├── game.routes.ts     # Game save/load endpoints
│   │   ├── campaigns.routes.ts # Campaign CRUD
│   │   └── wallet.routes.ts   # NFT collection fetching
│   ├── services/
│   │   ├── auth.service.ts    # Wallet signature verification
│   │   ├── game.service.ts    # Game state management
│   │   ├── campaign.service.ts # Achievement & campaign logic
│   │   └── helius.service.ts  # Helius DAS API integration
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── index.ts               # Express app setup
├── package.json
├── tsconfig.json
└── .env.example
```

**Environment Variables** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/terminal_game_db
JWT_SECRET=your_jwt_secret_key_here
API_KEY=your_internal_api_key
HELIUS_API_KEY=your_helius_api_key
COLLECTION_MINT_ADDRESS=your_cnft_collection_address
PORT=3001
NODE_ENV=development
```

**Deliverables**:
- Complete backend project structure
- Database connection with connection pooling
- Express app with CORS enabled
- Environment variable loading
- Basic health check endpoint: `GET /api/v1/health`

---

## 🔧 STEP 3: Database Service Layer

**Task**: Create database access layer with proper query builders.

**Instructions**:
1. Create a `db.ts` utility file with prepared statement helpers
2. Implement CRUD operations for each table
3. Use parameterized queries to prevent SQL injection
4. Add transaction support for multi-step operations

**Key Functions**:
```typescript
// database/db.ts
export async function query(text: string, params?: any[]): Promise<any>
export async function transaction(callback: (client) => Promise<any>): Promise<any>

// database/users.ts
export async function findUserByWallet(wallet: string): Promise<User | null>
export async function createUser(wallet: string): Promise<User>
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User>

// database/game-saves.ts
export async function findGameSave(wallet: string): Promise<GameSave | null>
export async function createGameSave(data: CreateGameSaveInput): Promise<GameSave>
export async function updateGameSave(wallet: string, data: Partial<GameSave>): Promise<GameSave>

// database/achievements.ts
export async function recordAchievement(wallet: string, stateName: string, value: string): Promise<void>
export async function getUserAchievements(wallet: string): Promise<Achievement[]>

// database/campaigns.ts
export async function findActiveCampaigns(): Promise<Campaign[]>
export async function findCampaignById(id: string): Promise<Campaign | null>
export async function recordCampaignWin(campaignId: string, userId: string, wallet: string): Promise<void>
export async function getCampaignWinners(campaignId: string): Promise<CampaignWinner[]>
```

---

## 🔧 STEP 4: Authentication System

**Task**: Implement Solana wallet signature-based authentication (Section 6).

**Auth Flow**:
```
1. POST /api/v1/auth/request-message
   → Generate random nonce message
   → Return: { message: "Sign this message to authenticate: <nonce>" }

2. Frontend signs message with wallet

3. POST /api/v1/auth/verify-wallet
   → Verify signature using nacl.sign.detached.verify()
   → Create user if doesn't exist
   → Generate JWT token (24hr expiry)
   → Return: { token: "jwt...", user: {...} }

4. Subsequent requests use: Authorization: Bearer <token>
```

**Implementation Files**:

**`src/services/auth.service.ts`**:
```typescript
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import jwt from 'jsonwebtoken';

export function generateAuthMessage(): string {
  const nonce = Math.random().toString(36).substring(2, 15);
  return `Sign this message to authenticate with YourGame: ${nonce}`;
}

export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  // Decode base58 signature
  // Verify ed25519 signature
  // Return true/false
}

export function generateToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { userId, walletAddress },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): { userId: string; walletAddress: string } {
  // Verify and decode JWT
}
```

**`src/routes/auth.routes.ts`**:
```typescript
router.post('/request-message', async (req, res) => {
  const { wallet_address } = req.body;
  // Validate wallet address format
  const message = generateAuthMessage();
  res.json({ message });
});

router.post('/verify-wallet', async (req, res) => {
  const { wallet_address, message, signature } = req.body;
  
  // 1. Verify signature
  if (!verifySignature(message, signature, wallet_address)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Find or create user
  let user = await findUserByWallet(wallet_address);
  if (!user) {
    user = await createUser(wallet_address);
  }
  
  // 3. Generate JWT
  const token = generateToken(user.id, wallet_address);
  
  res.json({ token, user });
});
```

**`src/middleware/auth.ts`**:
```typescript
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 🔧 STEP 5: User Profile Endpoints

**Task**: Implement user profile management (Section 4.2).

**Endpoints**:

```typescript
// GET /api/v1/users/check-wallet?wallet=<address>
router.get('/check-wallet', async (req, res) => {
  const { wallet } = req.query;
  const user = await findUserByWallet(wallet);
  res.json({ exists: !!user });
});

// GET /api/v1/users/profile (requires auth)
router.get('/profile', requireAuth, async (req, res) => {
  const user = await findUserByWallet(req.user.walletAddress);
  // Return full user profile with wallets array
});

// PUT /api/v1/users/profile (requires auth)
router.put('/profile', requireAuth, async (req, res) => {
  const { name, pfp_image_url, pfp_nft_id } = req.body;
  const updated = await updateUserProfile(req.user.userId, {
    name,
    pfp_image_url,
    pfp_nft_id
  });
  res.json(updated);
});
```

---

## 🔧 STEP 6: Game Save System

**Task**: Implement game state persistence (Section 4.3).

**Endpoints**:

**`GET /api/v1/game/load/:wallet_address`**:
```typescript
router.get('/load/:wallet_address', requireAuth, async (req, res) => {
  const { wallet_address } = req.params;
  
  // Security: verify user owns this wallet
  if (req.user.walletAddress !== wallet_address) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const save = await findGameSave(wallet_address);
  if (!save) {
    return res.status(404).json({ error: 'No save found' });
  }
  
  res.json({ save });
});
```

**`POST /api/v1/game/new`**:
```typescript
router.post('/new', requireAuth, async (req, res) => {
  const { starting_node_id, name } = req.body;
  const wallet_address = req.user.walletAddress;
  
  // Check if save already exists
  const existing = await findGameSave(wallet_address);
  if (existing) {
    return res.status(409).json({ error: 'Save already exists' });
  }
  
  const save = await createGameSave({
    user_id: req.user.userId,
    wallet_address,
    current_node_id: starting_node_id || 'start',
    location: 'HUB',
    game_state: {},
    inventory: [],
    name: name || 'Wanderer'
  });
  
  res.json({ save });
});
```

**`POST /api/v1/game/save`** (CRITICAL - Triggers campaign evaluation):
```typescript
router.post('/save', requireAuth, async (req, res) => {
  const { current_node_id, location, game_state, inventory, name } = req.body;
  const wallet_address = req.user.walletAddress;
  
  // 1. Update game save
  const save = await updateGameSave(wallet_address, {
    current_node_id,
    location,
    game_state,
    inventory,
    name
  });
  
  // 2. Process achievements (scan game_state for new state flags)
  await processAchievements(req.user.userId, wallet_address, game_state);
  
  // 3. Evaluate campaigns
  await evaluateCampaigns(req.user.userId, wallet_address);
  
  res.json({ save });
});
```

---

## 🔧 STEP 7: Achievement Processing Logic

**Task**: Implement achievement detection and recording.

**`src/services/campaign.service.ts`**:

```typescript
export async function processAchievements(
  userId: string,
  wallet: string,
  gameState: Record<string, any>
): Promise<void> {
  // Scan game_state for achievement-worthy flags
  // Record new achievements that haven't been recorded yet
  
  for (const [stateName, stateValue] of Object.entries(gameState)) {
    // Skip internal state keys
    if (stateName.startsWith('_') || stateName.startsWith('quiz_')) continue;
    
    // Only record "true" flags or significant values
    if (stateValue === 'true' || stateValue === true) {
      await recordAchievement(wallet, stateName, String(stateValue));
    }
  }
}

export async function evaluateCampaigns(
  userId: string,
  wallet: string
): Promise<void> {
  const activeCampaigns = await findActiveCampaigns();
  const userAchievements = await getUserAchievements(wallet);
  
  for (const campaign of activeCampaigns) {
    // Check if user already won this campaign
    const alreadyWon = await hasWonCampaign(campaign.id, wallet);
    if (alreadyWon) continue;
    
    // Check if campaign is full
    const winnerCount = await getCampaignWinnerCount(campaign.id);
    if (campaign.max_winners > 0 && winnerCount >= campaign.max_winners) {
      continue;
    }
    
    // Check if user meets requirements
    const meetsRequirements = checkCampaignRequirements(
      campaign,
      userAchievements
    );
    
    if (meetsRequirements) {
      // Award campaign win
      await recordCampaignWin(campaign.id, userId, wallet);
      
      // Optionally set state flag on user's game save
      if (campaign.sets_state) {
        await updateGameSaveState(wallet, {
          [campaign.sets_state]: 'true'
        });
      }
    }
  }
}

function checkCampaignRequirements(
  campaign: Campaign,
  achievements: Achievement[]
): boolean {
  const achievedStates = new Set(
    achievements
      .filter(a => a.state_value === campaign.target_value)
      .map(a => a.state_name)
  );
  
  if (campaign.require_all) {
    // ALL target states must be achieved
    return campaign.target_states.every(state => achievedStates.has(state));
  } else {
    // ANY target state is sufficient
    return campaign.target_states.some(state => achievedStates.has(state));
  }
}
```

---

## 🔧 STEP 8: Campaign Management Endpoints

**Task**: Implement full campaign CRUD and leaderboards (Section 4.4).

**Endpoints**:

```typescript
// GET /api/v1/campaigns - List all active campaigns
router.get('/', async (req, res) => {
  const campaigns = await findActiveCampaigns();
  // Include winner_count and is_full for each
  res.json({ campaigns });
});

// GET /api/v1/campaigns/:id - Get single campaign
router.get('/:id', async (req, res) => {
  const campaign = await findCampaignById(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json({ campaign });
});

// GET /api/v1/campaigns/:id/leaderboard - Get winners
router.get('/:id/leaderboard', async (req, res) => {
  const campaign = await findCampaignById(req.params.id);
  const leaderboard = await getCampaignWinners(req.params.id);
  res.json({ campaign, leaderboard });
});

// GET /api/v1/campaigns/user/progress - User's achievements
router.get('/user/progress', requireAuth, async (req, res) => {
  const achievements = await getUserAchievements(req.user.walletAddress);
  const campaignWins = await getUserCampaignWins(req.user.walletAddress);
  res.json({
    progress: {
      achievements,
      campaign_wins: campaignWins
    }
  });
});

// POST /api/v1/campaigns - Create campaign (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const campaign = await createCampaign(req.body);
  res.json({ campaign });
});

// PUT /api/v1/campaigns/:id - Update campaign (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const campaign = await updateCampaign(req.params.id, req.body);
  res.json({ campaign });
});

// DELETE /api/v1/campaigns/:id - Delete campaign (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await deleteCampaign(req.params.id);
  res.json({ success: true });
});
```

---

## 🔧 STEP 9: NFT Collection Fetching (Helius Integration)

**Task**: Implement cNFT fetching via Helius DAS API (Section 4.5).

**`src/services/helius.service.ts`**:

```typescript
import fetch from 'node-fetch';

const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const COLLECTION_MINT = process.env.COLLECTION_MINT_ADDRESS;

export async function fetchWalletCollections(walletAddress: string) {
  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'get-assets',
      method: 'searchAssets',
      params: {
        ownerAddress: walletAddress,
        grouping: ['collection', COLLECTION_MINT],
        page: 1,
        limit: 1000,
        compressed: true
      }
    })
  });
  
  const data = await response.json();
  const assets = data.result?.items || [];
  
  // Group by collection and extract attributes
  const collections = [];
  const nfts = assets.map(asset => ({
    id: asset.id,
    name: asset.content?.metadata?.name || 'Unknown',
    data_hash: asset.compression?.data_hash,
    attributes: asset.content?.metadata?.attributes || [],
    image: asset.content?.links?.image
  }));
  
  collections.push({
    collection_id: COLLECTION_MINT,
    nfts
  });
  
  return collections;
}

export async function getNFTDetails(assetId: string) {
  const response = await fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'get-asset',
      method: 'getAsset',
      params: { id: assetId }
    })
  });
  
  const data = await response.json();
  return data.result;
}
```

**`src/routes/wallet.routes.ts`**:
```typescript
router.get('/:address/collections', async (req, res) => {
  const { address } = req.params;
  const collections = await fetchWalletCollections(address);
  res.json(collections);
});
```

**`src/routes/nft.routes.ts`**:
```typescript
router.get('/:id', async (req, res) => {
  const nft = await getNFTDetails(req.params.id);
  res.json(nft);
});
```

---

## 🔧 STEP 10: Frontend Project Setup

**Task**: Initialize Next.js 14 frontend with all dependencies.

**Tech Stack**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Solana wallet adapter libraries

**Setup Commands**:
```bash
npx create-next-app@14 frontend --typescript --tailwind --app
cd frontend
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/spl-token
npm install @metaplex-foundation/mpl-bubblegum @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults
npm install bs58 tweetnacl
```

**Project Structure**:
```
frontend/
├── src/
│   ├── app/
│   │   ├── terminal/
│   │   │   ├── page.tsx
│   │   │   ├── CrocTerminal.tsx
│   │   │   ├── croc-terminal.css
│   │   │   └── components/
│   │   │       ├── Monitor.tsx
│   │   │       ├── StatsBox.tsx
│   │   │       ├── InventoryBox.tsx
│   │   │       └── LocationsBox.tsx
│   │   ├── api/
│   │   │   ├── proxy/[...path]/route.ts
│   │   │   └── rpc/route.ts
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   └── terminal/
│   │       ├── SnakeGame.tsx
│   │       └── IframeGame.tsx
│   ├── context/
│   │   └── AuthProvider.tsx
│   ├── data/
│   │   └── game-nodes.ts
│   ├── lib/
│   │   ├── game-engine.ts
│   │   ├── game-api.ts
│   │   ├── campaign-api.ts
│   │   ├── api.ts
│   │   ├── sirials-helius.ts
│   │   └── types/
│   │       └── game.ts
│   └── styles/
│       └── terminal-themes.css
└── public/
    ├── games/
    └── icons/
```

**Environment Variables** (`.env.local`):
```
NEXT_PUBLIC_RPC_URL=/api/rpc
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
API_BASE_URL=http://localhost:3001/api/v1
API_KEY=your_internal_api_key
```

---

## 🔧 STEP 11: API Proxy Layer

**Task**: Create Next.js API proxy routes (Section 18).

**`src/app/api/proxy/[...path]/route.ts`**:

```typescript
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

const ALLOWED_PATHS = [
  'auth/request-message',
  'auth/verify-wallet',
  'users/check-wallet',
  'users/profile',
  'game/new',
  'game/load',
  'game/save',
  'game/action',
  'campaigns',
  'campaigns/user/progress',
  'wallet',
  'nft'
];

function isPathAllowed(path: string): boolean {
  return ALLOWED_PATHS.some(allowed => path.startsWith(allowed));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  
  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }
  
  const url = `${API_BASE_URL}/${path}`;
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${url}?${searchParams}` : url;
  
  const headers: HeadersInit = {
    'X-API-Key': API_KEY!
  };
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  const response = await fetch(fullUrl, { headers });
  const data = await response.json();
  
  return NextResponse.json(data, { status: response.status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  
  if (!isPathAllowed(path)) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }
  
  const body = await request.json();
  const url = `${API_BASE_URL}/${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY!
  };
  
  const authHeader = request.headers.get('Authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  return NextResponse.json(data, { status: response.status });
}

// Implement PUT and DELETE similarly
```

**`src/app/api/rpc/route.ts`** (Solana RPC proxy):

```typescript
import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC_URL = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

const ALLOWED_METHODS = [
  'getAccountInfo',
  'getBalance',
  'searchAssets',
  'getAsset',
  'getAssetProof',
  'getLatestBlockhash',
  'sendTransaction',
  'simulateTransaction',
  'getSignatureStatuses'
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (!ALLOWED_METHODS.includes(body.method)) {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 403 }
    );
  }
  
  const response = await fetch(HELIUS_RPC_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return NextResponse.json(data);
}
```

---

## 🔧 STEP 12: Authentication Provider & Wallet Integration

**Task**: Implement frontend auth context with auto-authentication (Section 6).

**`src/context/AuthProvider.tsx`**:

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface AuthContextType {
  session: Session | null;
  isAuthenticated: boolean;
  authenticate: () => Promise<void>;
  logout: () => void;
}

interface Session {
  token: string;
  user: {
    id: string;
    wallet_address: string;
    is_cabal_member: boolean;
    is_admin: boolean;
  };
  fingerprint: string;
  expiresAt: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected } = useWallet();
  const [session, setSession] = useState<Session | null>(null);
  
  // Generate browser fingerprint
  const getFingerprint = () => {
    const ua = navigator.userAgent;
    const lang = navigator.language;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const screen = `${window.screen.width}x${window.screen.height}`;
    return btoa(`${ua}|${lang}|${tz}|${screen}`);
  };
  
  // Load session from storage
  useEffect(() => {
    const stored = sessionStorage.getItem('gameSession');
    if (stored) {
      const parsed = JSON.parse(stored);
      const fingerprint = getFingerprint();
      
      // Verify fingerprint and expiry
      if (parsed.fingerprint === fingerprint && parsed.expiresAt > Date.now()) {
        setSession(parsed);
        localStorage.setItem('sessionToken', parsed.token);
      } else {
        sessionStorage.removeItem('gameSession');
        localStorage.removeItem('sessionToken');
      }
    }
  }, []);
  
  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (connected && publicKey && !session) {
      authenticate();
    }
  }, [connected, publicKey]);
  
  const authenticate = async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected');
    }
    
    const walletAddress = publicKey.toBase58();
    
    // 1. Request message from backend
    const msgResponse = await fetch('/api/proxy/auth/request-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress })
    });
    const { message } = await msgResponse.json();
    
    // 2. Sign message
    const messageBytes = new TextEncoder().encode(message);
    const signature = await signMessage(messageBytes);
    const signatureBase58 = bs58.encode(signature);
    
    // 3. Verify with backend
    const verifyResponse = await fetch('/api/proxy/auth/verify-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        message,
        signature: signatureBase58
      })
    });
    
    const { token, user } = await verifyResponse.json();
    
    // 4. Store session
    const newSession: Session = {
      token,
      user,
      fingerprint: getFingerprint(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    
    setSession(newSession);
    sessionStorage.setItem('gameSession', JSON.stringify(newSession));
    localStorage.setItem('sessionToken', token);
  };
  
  const logout = () => {
    setSession(null);
    sessionStorage.removeItem('gameSession');
    localStorage.removeItem('sessionToken');
  };
  
  return (
    <AuthContext.Provider value={{
      session,
      isAuthenticated: !!session,
      authenticate,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**`src/app/providers.tsx`**:

```typescript
'use client';

import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { AuthProvider } from '@/context/AuthProvider';

require('@solana/wallet-adapter-react-ui/styles.css');

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = '/api/rpc';
  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

---

## 🔧 STEP 13: Game Engine Implementation

**Task**: Build the core client-side game engine (Section 8).

**`src/lib/types/game.ts`**:

```typescript
export interface GameNode {
  id: string;
  type: 'story' | 'choice' | 'puzzle' | 'nft_check' | 'item_check' | 'location' | 'quiz' | 'godot_game';
  content: string;
  location?: string;
  choices?: Array<{
    id: number;
    text: string;
    next_node: string;
    requirements?: {
      has_item?: string[];
      has_item_negate?: boolean[];
      state?: Record<string, any>;
      has_nft?: string;
      has_nft_negate?: boolean;
    };
  }>;
  effects?: {
    add_item?: string[];
    remove_item?: string[];
    set_state?: Record<string, any>;
  };
  next_node?: string;
  requires_sirial?: string;
  
  // NFT Check fields
  nft_id?: string;
  item_name?: string;
  nft_owned_content?: string;
  nft_missing_content?: string;
  nft_owned_next_node?: string;
  nft_missing_next_node?: string;
  
  // Quiz fields
  question?: string;
  correct_answer?: string | number;
  hint?: string;
  max_attempts?: number;
  success_node?: string;
  failure_node?: string;
  success_message?: string;
  failure_messages?: string[];
  
  // Godot game fields
  game_id?: string;
  start_prompt?: string;
  end_event?: string;
  end_message?: string;
  payload_store?: {
    mode: 'last' | 'history';
    state_key?: string;
  };
  payload_state_map?: Record<string, {
    state_key: string;
    mode?: 'set' | 'increment';
    multiplier?: number;
  }>;
}

export const LOCATIONS = [
  'HUB',
  'Forest',
  'Cave',
  'Mountain',
  'Desert',
  'Ocean',
  // Add your collection's locations
];

export interface GameSave {
  id?: number;
  wallet_address: string;
  current_node_id: string;
  location: string;
  game_state: Record<string, any>;
  inventory: string[];
  name?: string;
}
```

**`src/lib/game-engine.ts`** (Simplified version - full implementation ~1650 lines):

```typescript
import { GameNode, GameSave, LOCATIONS } from './types/game';
import { GAME_NODES } from '@/data/game-nodes';
import { loadGameSave, saveGameState, createNewGame } from './game-api';

export class GameEngine {
  private currentNode: GameNode | null = null;
  private walletAddress: string = '';
  private save: GameSave | null = null;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private ownedNFTs: any[] = [];
  
  constructor(
    private outputFn: (text: string, className?: string) => void,
    private locationChangeFn?: (location: string) => void,
    private inventoryChangeFn?: (items: any[]) => void
  ) {}
  
  async initialize(walletAddress: string) {
    this.walletAddress = walletAddress;
    
    // Try to load existing save
    try {
      const response = await loadGameSave(walletAddress);
      this.save = response.save;
      this.outputFn('Game loaded! Resuming your adventure...', 'text-green-400');
    } catch (error) {
      // No save found, create new game
      const response = await createNewGame('start', 'Wanderer');
      this.save = response.save;
      this.outputFn('New game created! Welcome, Wanderer.', 'text-cyan-400');
    }
    
    // Load current node
    this.currentNode = GAME_NODES[this.save.current_node_id];
    
    // Start auto-save timer (30 seconds)
    this.autoSaveTimer = setInterval(() => this.autoSave(), 30000);
    
    // Display current node
    this.displayCurrentNode();
  }
  
  displayCurrentNode() {
    if (!this.currentNode) return;
    
    // Render content with template substitution
    const content = this.renderTemplate(this.currentNode.content);
    this.outputFn(content, 'text-white');
    
    // Show choices if available
    if (this.currentNode.choices) {
      this.outputFn(''); // blank line
      const visibleChoices = this.currentNode.choices.filter(choice =>
        this.checkRequirements(choice.requirements)
      );
      
      visibleChoices.forEach(choice => {
        this.outputFn(`[${choice.id}] ${choice.text}`, 'text-cyan-400');
      });
    }
    
    // Update location
    if (this.currentNode.location) {
      this.locationChangeFn?.(this.currentNode.location);
    }
  }
  
  private renderTemplate(text: string): string {
    return text.replace(/\{\{state\.([^}]+)\}\}/g, (match, path) => {
      const value = this.getStatePath(path);
      return value !== undefined ? String(value) : match;
    });
  }
  
  private getStatePath(path: string): any {
    const keys = path.split('.');
    let value: any = this.save?.game_state;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  }
  
  checkRequirements(requirements?: any): boolean {
    if (!requirements) return true;
    
    // Check item requirements
    if (requirements.has_item) {
      for (let i = 0; i < requirements.has_item.length; i++) {
        const hasItem = this.save!.inventory.includes(requirements.has_item[i]);
        const negate = requirements.has_item_negate?.[i] || false;
        if (negate ? hasItem : !hasItem) return false;
      }
    }
    
    // Check state requirements
    if (requirements.state) {
      for (const [key, value] of Object.entries(requirements.state)) {
        if (this.save!.game_state[key] !== value) return false;
      }
    }
    
    // Check NFT requirements
    if (requirements.has_nft) {
      const hasNFT = this.ownedNFTs.some(nft => nft.id === requirements.has_nft);
      if (requirements.has_nft_negate ? hasNFT : !hasNFT) return false;
    }
    
    return true;
  }
  
  async moveToNode(nodeId: string) {
    const node = GAME_NODES[nodeId];
    if (!node) {
      this.outputFn(`Error: Node ${nodeId} not found`, 'text-red-400');
      return;
    }
    
    // Apply effects
    if (node.effects) {
      this.applyEffects(node.effects);
    }
    
    // Update current node
    this.currentNode = node;
    this.save!.current_node_id = nodeId;
    if (node.location) {
      this.save!.location = node.location;
    }
    
    // Auto-save
    await this.autoSave();
    
    // Display new node
    this.displayCurrentNode();
  }
  
  private applyEffects(effects: any) {
    if (effects.add_item) {
      for (const item of effects.add_item) {
        if (!this.save!.inventory.includes(item)) {
          this.save!.inventory.push(item);
          this.outputFn(`\n[Item obtained: ${item}]`, 'text-yellow-400');
        }
      }
      this.inventoryChangeFn?.(this.save!.inventory.map(name => ({ name })));
    }
    
    if (effects.remove_item) {
      for (const item of effects.remove_item) {
        const index = this.save!.inventory.indexOf(item);
        if (index > -1) {
          this.save!.inventory.splice(index, 1);
          this.outputFn(`\n[Item removed: ${item}]`, 'text-gray-400');
        }
      }
      this.inventoryChangeFn?.(this.save!.inventory.map(name => ({ name })));
    }
    
    if (effects.set_state) {
      this.save!.game_state = {
        ...this.save!.game_state,
        ...effects.set_state
      };
    }
  }
  
  async processInput(input: string) {
    const trimmed = input.trim();
    
    // Check for numbered choice
    const choiceNum = parseInt(trimmed);
    if (!isNaN(choiceNum) && this.currentNode?.choices) {
      const choice = this.currentNode.choices.find(c => c.id === choiceNum);
      if (choice && this.checkRequirements(choice.requirements)) {
        await this.moveToNode(choice.next_node);
        return;
      }
    }
    
    // Check for ENTER to continue
    if (trimmed === '' && this.currentNode?.next_node) {
      await this.moveToNode(this.currentNode.next_node);
      return;
    }
    
    // Check for travel command
    if (trimmed.toLowerCase().startsWith('travel to') || trimmed.toLowerCase().startsWith('go ')) {
      const location = trimmed.split(/travel to|go /i)[1]?.trim();
      await this.handleTravel(location);
      return;
    }
    
    this.outputFn('Invalid input. Type a choice number or command.', 'text-gray-400');
  }
  
  async handleTravel(locationName: string) {
    const location = LOCATIONS.find(loc => 
      loc.toLowerCase() === locationName.toLowerCase()
    );
    
    if (!location) {
      this.outputFn('Unknown location.', 'text-red-400');
      return;
    }
    
    // Check if hub location (always accessible)
    if (location === 'HUB') {
      await this.moveToNode('hub_entrance');
      return;
    }
    
    // Check NFT ownership for location access
    const hasAccess = this.ownedNFTs.some(nft => {
      const locationAttr = nft.attributes?.find(
        (a: any) => a.trait_type === 'Location'
      );
      return locationAttr?.value === location || locationAttr?.value === 'Universal';
    });
    
    if (!hasAccess) {
      this.outputFn(
        `You need an NFT with the "${location}" location to travel there.`,
        'text-red-400'
      );
      return;
    }
    
    // Find location entry node
    const entryNode = Object.values(GAME_NODES).find(
      node => node.type === 'location' && node.location === location
    );
    
    if (entryNode) {
      await this.moveToNode(entryNode.id);
    }
  }
  
  async autoSave() {
    if (!this.save) return;
    
    try {
      await saveGameState({
        current_node_id: this.save.current_node_id,
        location: this.save.location,
        game_state: this.save.game_state,
        inventory: this.save.inventory,
        name: this.save.name || 'Wanderer'
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }
  
  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.autoSave(); // Final save
  }
  
  // Setters for external data
  setOwnedNFTs(nfts: any[]) {
    this.ownedNFTs = nfts;
  }
}
```

---

## 🔧 STEP 14: Terminal UI Component

**Task**: Build the main CRT terminal interface (Section 10).

**`src/app/terminal/CrocTerminal.tsx`** (Simplified version):

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthProvider';
import { GameEngine } from '@/lib/game-engine';
import { fetchOwnedSirials } from '@/lib/sirials-helius';
import './croc-terminal.css';

interface OutputLine {
  text: string;
  isUser?: boolean;
  className?: string;
  timestamp: number;
}

export default function CrocTerminal() {
  const { publicKey, connected } = useWallet();
  const { isAuthenticated } = useAuth();
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [input, setInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState('HUB');
  const [inventory, setInventory] = useState<any[]>([]);
  const engineRef = useRef<GameEngine | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize game engine when authenticated
  useEffect(() => {
    if (isAuthenticated && publicKey && !engineRef.current) {
      const engine = new GameEngine(
        addOutput,
        setCurrentLocation,
        setInventory
      );
      
      engineRef.current = engine;
      
      // Fetch owned NFTs
      fetchOwnedSirials(publicKey.toBase58()).then(nfts => {
        engine.setOwnedNFTs(nfts);
      });
      
      // Initialize game
      engine.initialize(publicKey.toBase58());
    }
    
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [isAuthenticated, publicKey]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);
  
  const addOutput = (text: string, className?: string) => {
    setOutput(prev => [...prev, {
      text,
      className,
      timestamp: Date.now()
    }]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Echo user input
    addOutput(`> ${input}`, 'text-gray-400');
    
    // Process through game engine
    if (engineRef.current) {
      await engineRef.current.processInput(input);
    }
    
    setInput('');
  };
  
  return (
    <div className="retro-container">
      <div className="terminal-section">
        <div className="terminal-header">
          <span>GAME TERMINAL v1.0</span>
          <span>{currentLocation}</span>
        </div>
        
        <div className="terminal-output">
          {output.map((line, i) => (
            <div
              key={i}
              className={`terminal-line ${line.className || ''}`}
            >
              {line.text}
            </div>
          ))}
          <div ref={outputEndRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <span className="terminal-prompt">&gt;_</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="terminal-input"
            autoFocus
            placeholder={connected ? "Enter command..." : "Connect wallet to start"}
            disabled={!connected}
          />
        </form>
      </div>
      
      <div className="monitor-section">
        {/* Monitor, Stats, Inventory, Locations components */}
      </div>
    </div>
  );
}
```

**`src/app/terminal/croc-terminal.css`**:

```css
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

:root {
  --primary-color: #2dfe39;
  --primary-rgb: 45, 254, 57;
  --primary-dim: #1fb527;
  --primary-dark: #158c1d;
  --primary-light: #5fff66;
  --primary-glow: rgba(45, 254, 57, 0.5);
}

.retro-container {
  display: flex;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: #0a0a0a;
  font-family: 'VT323', monospace;
}

.terminal-section {
  flex: 1;
  background: #1a1a1a;
  border: 3px solid var(--primary-color);
  border-radius: 10px;
  box-shadow: 0 0 20px var(--primary-glow);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Scanline effect */
.terminal-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    rgba(var(--primary-rgb), 0.03) 50%,
    rgba(0, 0, 0, 0.3) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  animation: scanlines 10s linear infinite;
}

@keyframes scanlines {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  background: rgba(var(--primary-rgb), 0.1);
  border-bottom: 2px solid var(--primary-color);
  color: var(--primary-color);
  font-size: 20px;
}

.terminal-output {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  color: var(--primary-color);
}

.terminal-line {
  font-size: 22px;
  line-height: 1.4;
  white-space: pre-wrap;
  animation: typeIn 0.5s ease-out;
}

@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.terminal-input-form {
  display: flex;
  gap: 10px;
  padding: 20px;
  border-top: 2px solid var(--primary-color);
  background: rgba(var(--primary-rgb), 0.05);
}

.terminal-prompt {
  color: var(--primary-color);
  font-size: 24px;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--primary-color);
  font-family: 'VT323', monospace;
  font-size: 24px;
  outline: none;
}

.terminal-input::placeholder {
  color: var(--primary-dim);
  opacity: 0.5;
}

/* Color classes */
.text-white { color: var(--primary-color); }
.text-yellow-400 { color: #fbbf24; }
.text-cyan-400 { color: #22d3ee; }
.text-green-400 { color: #4ade80; }
.text-red-400 { color: #f87171; }
.text-gray-400 { color: #9ca3af; }

/* Scrollbar */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 5px;
}

/* Monitor section */
.monitor-section {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Mobile responsive */
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
  
  .monitor-section {
    display: none;
  }
}
```

---

## 🔧 STEP 15: Game Content Definition

**Task**: Create the game nodes data file (Section 9).

**`src/data/game-nodes.ts`**:

```typescript
import { GameNode } from '@/lib/types/game';

export const GAME_NODES: Record<string, GameNode> = {
  start: {
    id: 'start',
    type: 'story',
    content: 'You awaken in a dimly lit room. The air smells of dust and old circuits. A terminal flickers to life before you.\n\nWelcome, traveler. Your journey begins now.',
    location: 'HUB',
    next_node: 'hub_entrance'
  },
  
  hub_entrance: {
    id: 'hub_entrance',
    type: 'choice',
    content: 'You stand in the central hub. Paths branch out in all directions. Where will you go?',
    location: 'HUB',
    choices: [
      {
        id: 1,
        text: 'Explore the market district',
        next_node: 'market_entrance'
      },
      {
        id: 2,
        text: 'Visit the library',
        next_node: 'library_entrance',
        requirements: {
          has_item: ['Library Card']
        }
      },
      {
        id: 3,
        text: 'Check your inventory',
        next_node: 'inventory_check'
      }
    ]
  },
  
  market_entrance: {
    id: 'market_entrance',
    type: 'location',
    content: 'The market bustles with activity. Vendors call out their wares. You spot a mysterious shopkeeper in the corner.',
    location: 'Market',
    requires_sirial: 'Market', // Requires NFT with Location: Market
    choices: [
      {
        id: 1,
        text: 'Approach the mysterious shopkeeper',
        next_node: 'mysterious_shop'
      },
      {
        id: 2,
        text: 'Browse the market stalls',
        next_node: 'market_browse'
      },
      {
        id: 3,
        text: 'Return to hub',
        next_node: 'hub_entrance'
      }
    ]
  },
  
  mysterious_shop: {
    id: 'mysterious_shop',
    type: 'nft_check',
    content: 'The shopkeeper eyes you carefully. "I have something special for those who belong here."',
    location: 'Market',
    nft_id: 'YOUR_SPECIAL_NFT_MINT_ADDRESS', // Replace with actual NFT ID
    item_name: 'Ancient Key',
    nft_owned_content: 'The shopkeeper nods in recognition. "Ah, I see you are one of us." They hand you an ancient key.',
    nft_missing_content: 'The shopkeeper shakes their head. "Come back when you have proven yourself."',
    nft_owned_next_node: 'shop_success',
    nft_missing_next_node: 'market_entrance'
  },
  
  quiz_example: {
    id: 'quiz_example',
    type: 'quiz',
    content: 'An old sage blocks your path. "Answer my riddle to proceed."',
    question: 'What has keys but no locks, space but no room, and you can enter but not go inside?',
    correct_answer: 'keyboard',
    hint: 'Think about what you type on...',
    max_attempts: 3,
    success_message: 'The sage smiles. "Well done, traveler."',
    failure_messages: [
      'The sage shakes his head. "Not quite. Try again."',
      'The sage frowns. "Think harder."',
      'The sage sighs. "One more chance..."'
    ],
    final_failure_message: 'The sage turns away. "Perhaps another time."',
    success_node: 'quiz_success',
    failure_node: 'quiz_failure',
    success_effects: {
      add_item: ['Sage\'s Blessing'],
      set_state: { 'riddle_solved': 'true' }
    }
  },
  
  godot_game_example: {
    id: 'godot_game_example',
    type: 'godot_game',
    game_id: 'snake_game',
    content: 'You find an old arcade machine. A game of Snake flickers on screen.',
    start_prompt: 'Press ENTER to play Snake!',
    location: 'Arcade',
    end_event: 'game_over',
    end_message: 'Game Over! Your score: {{metrics.score}}',
    payload_store: {
      mode: 'last',
      state_key: 'game_payloads.snake'
    },
    payload_state_map: {
      'score': {
        state_key: 'game_stats.snake_high_score',
        mode: 'set'
      }
    },
    next_node: 'arcade_main'
  },
  
  // Add more nodes for your game story...
  // Each node should advance the narrative
  // Use effects to track progress
  // Use requirements to gate content
};
```

**Instructions for expanding**:
1. Plan your story structure first (draw a flowchart)
2. Create location entry nodes for each area
3. Add story progression nodes with choices
4. Include quiz nodes for challenges
5. Add NFT check nodes for gated content
6. Use `effects.set_state` to track player progress
7. Use `{{state.key}}` templating for dynamic text
8. Test each path thoroughly

---

## 🔧 STEP 16: NFT Integration & Travel System

**Task**: Implement NFT fetching and location-based travel.

**`src/lib/sirials-helius.ts`**:

```typescript
const COLLECTION_MINT = process.env.NEXT_PUBLIC_COLLECTION_MINT!;

export async function fetchOwnedSirials(walletAddress: string) {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'fetch-nfts',
      method: 'searchAssets',
      params: {
        ownerAddress: walletAddress,
        grouping: ['collection', COLLECTION_MINT],
        page: 1,
        limit: 1000,
        compressed: true
      }
    })
  });
  
  const data = await response.json();
  const assets = data.result?.items || [];
  
  return assets.map((asset: any) => ({
    id: asset.id,
    name: asset.content?.metadata?.name || 'Unknown',
    attributes: asset.content?.metadata?.attributes || [],
    image: asset.content?.links?.image,
    data_hash: asset.compression?.data_hash
  }));
}

export async function getNFTDetails(assetId: string) {
  const response = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'get-asset',
      method: 'getAsset',
      params: { id: assetId }
    })
  });
  
  const data = await response.json();
  return data.result;
}
```

**Add to GameEngine** (travel validation):

```typescript
// In GameEngine class
async handleTravel(locationName: string) {
  const location = LOCATIONS.find(loc => 
    loc.toLowerCase() === locationName.toLowerCase()
  );
  
  if (!location) {
    this.outputFn('Unknown location.', 'text-red-400');
    return;
  }
  
  // Hub is always accessible
  if (location === 'HUB') {
    const hubNode = Object.values(GAME_NODES).find(
      node => node.location === 'HUB' && node.type === 'location'
    );
    if (hubNode) await this.moveToNode(hubNode.id);
    return;
  }
  
  // Check NFT ownership for location access
  const hasLocationAccess = this.ownedNFTs.some(nft => {
    const locationAttr = nft.attributes?.find(
      (a: any) => a.trait_type === 'Location'
    );
    return locationAttr?.value === location || locationAttr?.value === 'Universal';
  });
  
  if (!hasLocationAccess) {
    this.outputFn(
      `Access denied. You need an NFT with the "${location}" location trait.`,
      'text-red-400'
    );
    this.outputFn(
      `Acquire an NFT from the collection to unlock this area.`,
      'text-yellow-400'
    );
    return;
  }
  
  // Find location entry node
  const entryNode = Object.values(GAME_NODES).find(
    node => node.type === 'location' && node.location === location
  );
  
  if (entryNode) {
    this.outputFn(`Traveling to ${location}...`, 'text-cyan-400');
    await this.moveToNode(entryNode.id);
  } else {
    this.outputFn(`${location} is not yet accessible.`, 'text-gray-400');
  }
}
```

---

## 🔧 STEP 17: Final Polish & Testing

**Tasks**:

1. **Add remaining UI components**:
   - Monitor.tsx (CRT display for NFT images)
   - StatsBox.tsx (campaign progress)
   - InventoryBox.tsx (visual inventory)
   - LocationsBox.tsx (location navigator)

2. **Implement terminal commands** (help, clear, theme, etc.)

3. **Add mobile responsive sidebar**

4. **Test complete user flows**:
   - New player onboarding
   - Save/load persistence
   - NFT-gated content
   - Travel between locations
   - Quiz completion
   - Campaign achievement

5. **Deploy**:
   - Backend: Render.com or similar
   - Frontend: Vercel
   - Database: PostgreSQL (Render, Supabase, or Neon)

---

## ✅ Configuration Checklist

Before launching, configure these values:

### Backend `.env`:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<random_256_bit_key>
API_KEY=<random_api_key>
HELIUS_API_KEY=<your_helius_key>
COLLECTION_MINT_ADDRESS=<your_cnft_collection_address>
PORT=3001
```

### Frontend `.env.local`:
```bash
API_BASE_URL=https://your-backend.com/api/v1
API_KEY=<same_as_backend>
NEXT_PUBLIC_RPC_URL=/api/rpc
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=<key>
NEXT_PUBLIC_COLLECTION_MINT=<your_cnft_collection_address>
```

### Collection-Specific Values:
1. **COLLECTION_MINT_ADDRESS**: Your cNFT collection mint address
2. **LOCATIONS array**: Match your NFT "Location" trait values
3. **Game nodes**: Write your unique story content
4. **Starting node**: Set the entry point (usually 'start' or 'hub')

---

## 📝 Development Workflow

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database
psql terminal_game_db
```

Access at: http://localhost:3000/terminal

---

## 🎮 Customization Guide

### To adapt for your collection:

1. **Update LOCATIONS** in `src/lib/types/game.ts` to match your NFT traits
2. **Create game nodes** in `src/data/game-nodes.ts` with your story
3. **Set collection address** in environment variables
4. **Customize themes** in `terminal-themes.css` (change color variables)
5. **Add location icons** to `/public/icons/` directory
6. **Update campaign targets** to match your game states

### Theme customization:
```css
/* Change primary color for entire terminal */
:root {
  --primary-color: #ff0040;  /* Your color here */
  --primary-rgb: 255, 0, 64; /* RGB values */
}
```

---

## 🚀 Launch Checklist

- [ ] Database schema created and migrated
- [ ] Backend API running and tested
- [ ] Authentication flow working (sign message)
- [ ] Game save/load persistence verified
- [ ] NFT fetching from Helius working
- [ ] Travel system respects NFT ownership
- [ ] Campaign evaluation triggers on save
- [ ] All game nodes have valid next_node references
- [ ] Mobile responsive design tested
- [ ] Environment variables configured for production
- [ ] Backend deployed (Render/Railway/etc.)
- [ ] Frontend deployed (Vercel)
- [ ] Database deployed (production PostgreSQL)
- [ ] SSL certificates active (HTTPS)
- [ ] API proxy routes secured
- [ ] Rate limiting configured (optional but recommended)

---

## 🎯 Success Metrics

Your game is ready when:
1. ✅ Players can connect wallet and auto-authenticate
2. ✅ New players create saves, returning players load existing ones
3. ✅ Game state persists across sessions
4. ✅ NFT ownership gates work (travel, items, choices)
5. ✅ Campaigns auto-detect achievements and award wins
6. ✅ Terminal UI renders correctly on desktop and mobile
7. ✅ No console errors in production

---

## 📚 Additional Resources

- Solana Web3.js docs: https://solana-labs.github.io/solana-web3.js/
- Helius DAS API: https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api
- Wallet Adapter: https://github.com/solana-labs/wallet-adapter
- Next.js docs: https://nextjs.org/docs
- PostgreSQL docs: https://www.postgresql.org/docs/

---

## 🐛 Common Issues & Solutions

**"No save found" error on load**:
- Ensure `/api/v1/game/load/:wallet` returns 404 for new players
- Frontend should catch 404 and call `/api/v1/game/new`

**NFTs not loading**:
- Verify COLLECTION_MINT_ADDRESS is correct
- Check Helius API key is valid
- Ensure searchAssets method is allowed in RPC proxy

**Campaigns not awarding**:
- Verify processAchievements() runs on every save
- Check campaign.target_states match actual game_state keys
- Confirm target_value matches (usually "true" as string)

**Auto-save not working**:
- Ensure 30-second timer is set in GameEngine
- Verify auth token is included in save requests
- Check for CORS issues with backend
