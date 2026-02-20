# Security Fixes — Deployment Guide

Deployment changes required to accompany the 25+ security fixes applied across backend and frontend.

---

## Pre-Deployment Checklist (Required)

These will cause failures if skipped:

- [ ] **Set `FRONTEND_URL`** on backend hosting (e.g. `https://yourapp.vercel.app`, no trailing slash). Server will refuse to start without it in production.
- [ ] **Confirm `API_KEY`** is set identically in backend and frontend env. All proxied requests return 403 if mismatched.
- [ ] **Confirm `JWT_SECRET`** is at least 32 characters. Server exits on startup if too short in production.
- [ ] **Confirm `DATABASE_URL`** is set in production.
- [ ] **Run `npm install`** in `/backend` — new production deps: `helmet`, `express-rate-limit`.
- [ ] **Run migration 002** if not already applied (`last_active_at` column on `users` table).
- [ ] **Verify Postgres SSL** — `rejectUnauthorized: true` is now enforced in production. Neon/Supabase/Render are fine. Self-hosted with self-signed certs need `DATABASE_CA_CERT` env var set to the PEM string.

---

## Environment Variables

### Backend (new or changed)

| Variable | Required | Notes |
|----------|----------|-------|
| `FRONTEND_URL` | **Yes (production)** | Exact origin for CORS. Startup-fatal if missing. |
| `DATABASE_CA_CERT` | Only if self-signed cert | Full PEM string for Postgres CA certificate. |
| `JWT_SECRET` | **Yes** | Min 32 chars in production (enforced at startup). |
| `API_KEY` | **Yes (production)** | Must match frontend's `API_KEY`. Startup-fatal if missing. |
| `ADMIN_WALLETS` | No | Comma-separated wallet addresses to seed as admins. |

### Frontend (new)

| Variable | Required | Notes |
|----------|----------|-------|
| `HELIUS_RPC_URL` | Recommended | Server-only (no `NEXT_PUBLIC_` prefix). Prevents Helius API key leaking to browser bundles. Falls back to `NEXT_PUBLIC_HELIUS_RPC_URL`. |

---

## Database

**No new migrations.** The schema is unchanged. Only verify migration 002 has been applied:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='users' AND column_name='last_active_at';
```

If empty, run:
```bash
psql $DATABASE_URL < database/migrations/002_add_last_active.sql
```

---

## Breaking Changes

### 1. JWT Session Invalidation (one-time forced logout)

Tokens now include `issuer` and `audience` claims and strictly validate them. All existing JWTs will be rejected. Users must re-authenticate on first visit after deployment. No DB action needed.

### 2. CORS Locked to `FRONTEND_URL`

Previously may have been permissive. Now in production, only the exact `FRONTEND_URL` origin is allowed for both REST API and Socket.IO. Wrong value = all browser requests fail with CORS errors.

### 3. Wallet Routes Require Auth

`GET /wallet/:address/collections` and `GET /wallet/nft/:id` now require authentication. Users can only query their own wallet's collections (403 for others). If admin tooling queries arbitrary wallets through these endpoints, it will break.

### 4. Body Size Limits

- JSON body limit: **100KB** (rejects with 413)
- `game_state` field: **50KB** max
- `inventory` field: **10KB** max, 100 items max

Previously-accepted oversized payloads will now be rejected.

### 5. Achievement Allowlist (auto-generated)

Valid achievement state keys are auto-extracted from `frontend/src/data/game-nodes.ts` into `backend/src/data/valid-achievement-states.json`. The extraction runs automatically during `npm run build`.

To regenerate manually after changing game content:

```bash
npm run extract-states
```

The script scans all `set_state` effects in game nodes, filtering out internal (`_`-prefixed) and quiz (`quiz_`-prefixed) keys. No manual backend changes are needed when adding or removing game states.

---

## Rate Limiting

| Limiter | Routes | Window | Max |
|---------|--------|--------|-----|
| `authLimiter` | `/api/v1/auth/*` | 15 min | 10/IP |
| `apiLimiter` | `/api/v1/users/*`, `/campaigns/*`, `/wallet/*` | 1 min | 100/IP |
| `writeLimiter` | `/api/v1/game/*` | 1 min | 30/IP |
| RPC proxy | `/api/rpc` (frontend) | 1 min | 30/IP |

Rate limiters are **in-memory only**. If running multiple backend instances, limits are per-instance and not shared. For true multi-instance enforcement, add a Redis store to `express-rate-limit`.

---

## Security Headers (Helmet)

`helmet()` middleware now adds these headers automatically:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection` (legacy browsers)
- `Strict-Transport-Security` (HSTS)
- Removes `X-Powered-By`

No configuration needed — this is handled by the `helmet` package.

---

## Socket.IO Changes

- Max message size: **10KB** (`maxHttpBufferSize`)
- Connection limit: **10 per IP**
- JWT auth required in handshake (`socket.handshake.auth.token`)
- Clients without valid JWT are rejected

---

## Error Handling

In production, unhandled error details are no longer returned to clients. Responses show `"An unexpected error occurred"` instead of raw error messages. Server-side logging is unchanged.

---

## Post-Deployment Verification

```bash
# Health check (should NOT contain env/nodeEnv fields)
curl https://your-backend/api/v1/health

# Verify security headers
curl -I https://your-backend/api/v1/health | grep -i 'x-content-type\|x-frame\|x-powered'

# Verify CORS (should succeed from correct origin only)
curl -H "Origin: https://yourapp.vercel.app" -I https://your-backend/api/v1/health

# Run security test suite
cd backend && npm test
```

---

## Horizontal Scaling Note

If running multiple backend instances behind a load balancer:

1. **Rate limiting** — Add Redis store to `express-rate-limit`, otherwise limits are per-pod
2. **Nonce store** — In-memory, per-instance. A nonce generated on instance A won't be found on instance B. For multi-instance, move nonce storage to Redis or DB
3. **Socket.IO** — Needs `@socket.io/redis-adapter` for cross-instance room messaging
