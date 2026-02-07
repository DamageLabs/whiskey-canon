# Discord Bot Integration for Whiskey Canon

## Context

Whiskey Canon is a full-stack whiskey collection manager with a rich REST API (39 endpoints), comprehensive statistics, and 57-field whiskey data. A Discord bot allows users to interact with their collections from Discord — viewing stats, searching bottles, getting drink suggestions, and sharing profiles. The current session-based auth (httpOnly cookies) doesn't support bot-to-API communication, so API key authentication must be added to the backend first.

## Architecture

The bot is a new `bot/` npm workspace that communicates with the backend exclusively via HTTP. All business logic stays in the backend. The bot is a thin presentation layer that formats API responses into Discord embeds.

```
┌─────────────┐     HTTP + x-api-key     ┌─────────────┐     SQLite
│  Discord.js │  ──────────────────────►  │  Express.js │  ──────────►  whiskey.db
│  Bot (bot/) │  ◄──────────────────────  │  API (backend/) │
└─────────────┘     JSON responses        └─────────────┘
```

- Bot makes server-to-server HTTP requests (no CORS needed)
- API key auth runs alongside session auth — existing web app is unaffected
- User isolation preserved: bot authenticates as a specific user via their API key

---

## Phase 1: Backend API Key Infrastructure

### New Table: `api_keys`

Added to `backend/src/utils/database.ts` in `initializeDatabase()`:

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT DEFAULT 'default',
  discord_user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### New Model: `backend/src/models/ApiKey.ts`

Follows the `UserModel` pattern (static methods, `db.prepare()`, synchronous queries):

| Method | Description |
|--------|-------------|
| `create(userId, label)` | Generate `wc_` + 48 hex chars, store SHA-256 hash, return plaintext once |
| `validate(plainKey)` | SHA-256 hash input, look up `key_hash`, return `user_id` or null |
| `linkDiscord(userId, discordUserId)` | Set `discord_user_id` on user's key |
| `findByDiscordUserId(discordUserId)` | Return `{ userId, keyHash }` for linked accounts |
| `findByUserId(userId)` | List keys (id, label, created_at, last_used_at — never the hash) |
| `revoke(id, userId)` | Delete key if owned by user |
| `touch(keyHash)` | Update `last_used_at` timestamp |

**Key format:** `wc_` prefix + 48 random hex characters (192 bits of entropy). SHA-256 hash stored in database (fast enough for per-request validation; bcrypt is too slow).

### Auth Middleware Changes: `backend/src/middleware/auth.ts`

`attachUser` extended with API key fallback (session auth checked first, API key only if no session):

```typescript
export function attachUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.session.userId) {
    req.user = UserModel.findById(req.session.userId);
  }
  if (!req.user) {
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (apiKey) {
      const userId = ApiKeyModel.validate(apiKey);
      if (userId) {
        req.user = UserModel.findById(userId);
      }
    }
  }
  next();
}
```

`requireAuth` updated to check `req.user` (works for both session and API key auth):

```typescript
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
```

### New Routes: `backend/src/routes/apikeys.ts`

All require session auth (only accessible from web UI):

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/api-keys` | Generate key, return plaintext once |
| `GET` | `/api/auth/api-keys` | List user's keys (metadata only) |
| `DELETE` | `/api/auth/api-keys/:id` | Revoke a key |
| `POST` | `/api/auth/api-keys/link-discord` | Store Discord user ID on a key (called by bot during `/link`) |

---

## Phase 2: Bot Workspace

### Workspace Setup

Root `package.json` updated:
- Workspaces: `["backend", "frontend", "bot"]`
- Scripts: `dev:bot`, `deploy-commands`
- Dev command runs all three concurrently

### File Structure

```
bot/
  package.json              # discord.js ^14.14, dotenv, tsx
  tsconfig.json
  .env.example              # DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, BACKEND_URL
  src/
    index.ts                # Client setup, login, event/command registration
    config.ts               # Env var loading
    api/
      client.ts             # fetch wrapper: base URL + x-api-key header
    commands/
      index.ts              # Command registry
      link.ts               # /link <api_key>
      unlink.ts             # /unlink
      collection.ts         # /collection
      search.ts             # /search <query>
      top.ts                # /top [count]
      investment.ts         # /investment
      random.ts             # /random [type]
      drink.ts              # /drink
      profile.ts            # /profile <username>
    events/
      ready.ts              # Log bot online
      interactionCreate.ts  # Route slash commands to handlers
    utils/
      embeds.ts             # EmbedBuilder helpers
      formatters.ts         # Currency, rating stars, truncation
    deploy-commands.ts      # Register slash commands with Discord API
```

### Dependencies

```json
{
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Environment Variables

```
DISCORD_BOT_TOKEN=<from Discord Developer Portal>
DISCORD_CLIENT_ID=<application ID from Discord Developer Portal>
DISCORD_GUILD_ID=<optional: dev-only, registers commands to single guild instantly>
BACKEND_URL=http://localhost:3000
```

### API Client (`bot/src/api/client.ts`)

Thin wrapper around `fetch`:
- Prepends `BACKEND_URL` to paths
- Sets `x-api-key` header from the user's stored key
- Handles 401 (unlinked), 403 (permission denied), 500 (server error) with user-friendly messages

### Account Linking Flow

1. User generates API key in Whiskey Canon web UI (Profile → API Keys)
2. User runs `/link <api_key>` in Discord (ephemeral response hides the key)
3. Bot calls `GET /api/auth/me` with the key to validate
4. If valid, bot calls `POST /api/auth/api-keys/link-discord` with Discord user ID
5. Bot stores `discordUserId → apiKey` mapping in memory
6. Subsequent commands look up the API key by Discord user ID automatically

**Storage:** In-memory Map for Phase 1 (users re-link on bot restart). Encrypted SQLite persistence is a future enhancement.

---

## Phase 3: Slash Commands

### Command Reference

| Command | Args | Auth | Description |
|---------|------|------|-------------|
| `/link` | `api_key` (string, required) | None | Link Discord account to Whiskey Canon (ephemeral) |
| `/unlink` | — | Linked | Remove account link (ephemeral) |
| `/collection` | — | Linked | Collection summary: bottles, value, types, avg rating |
| `/search` | `query` (string, required) | Linked | Search collection, show up to 5 results |
| `/top` | `count` (int, 1–10, default 5) | Linked | Top-rated bottles with tasting notes |
| `/investment` | — | Linked | Investment portfolio: ROI, most valuable, gain/loss |
| `/random` | `type` (choice, optional) | Linked | Random bottle, optionally filtered by type |
| `/drink` | — | Linked | Suggest an opened bottle to drink tonight |
| `/profile` | `username` (string, required) | None | View public profile stats (no account link needed) |

### API Endpoints Used by Each Command

| Command | Backend Endpoint |
|---------|-----------------|
| `/link` | `GET /api/auth/me`, `POST /api/auth/api-keys/link-discord` |
| `/collection` | `GET /api/statistics` |
| `/search` | `GET /api/whiskeys/search?q=` |
| `/top` | `GET /api/statistics` → `quality.highestRated` |
| `/investment` | `GET /api/statistics` → `financial.*` |
| `/random` | `GET /api/whiskeys?type=` + client-side random pick |
| `/drink` | `GET /api/whiskeys` → filter `is_opened && remaining_volume > 0` |
| `/profile` | `GET /api/users/:username/stats` (public, no auth) |

### Embed Formatting

**Whiskey detail embed:**
- Color: Amber (`0xD4A03C`)
- Title: bottle name
- Fields: type, distillery, region, age, ABV, proof
- Rating with stars: `★★★★☆ (8.5/10)`
- Pricing: paid / MSRP / secondary
- Tasting notes: nose, palate, finish
- Footer badges: Limited Edition, Investment, Awards

**Collection summary embed:**
- Color: Brand blue (`0x5B9BD5`)
- Fields: total bottles, total value, total invested, gain/loss, avg rating, opened/sealed
- Type breakdown list

**Investment embed:**
- Color: Green (`0x2ECC71`)
- Fields: total invested, current value, gain/loss
- Top 5 most valuable bottles
- Top 5 best ROI percentages

---

## Phase 4: Frontend API Key Management UI

Add an "API Keys" section to `frontend/src/pages/ProfilePage.tsx`:

- **Generate button** → calls `POST /api/auth/api-keys` → displays key once in a copyable field with a "this won't be shown again" warning
- **Key table** → shows label, created date, last used date, with revoke button per row
- **Instructions** → "Use this key with the Whiskey Canon Discord bot `/link` command"

New API service methods in `frontend/src/services/api.ts`:
- `apiKeys.generate(label)` → `POST /api/auth/api-keys`
- `apiKeys.list()` → `GET /api/auth/api-keys`
- `apiKeys.revoke(id)` → `DELETE /api/auth/api-keys/:id`

---

## File Change Summary

### Backend — Modified

| File | Change |
|------|--------|
| `backend/src/utils/database.ts` | Add `api_keys` CREATE TABLE in `initializeDatabase()` |
| `backend/src/middleware/auth.ts` | Extend `attachUser` + `requireAuth` for API key auth |
| `backend/src/index.ts` | Register apikeys route |

### Backend — Created

| File | Purpose |
|------|---------|
| `backend/src/models/ApiKey.ts` | API key model (CRUD + validation) |
| `backend/src/routes/apikeys.ts` | API key management endpoints |
| `backend/src/routes/apikeys.test.ts` | Tests for API key infrastructure |

### Bot — Created

All ~15 files under `bot/` as listed in the file structure above.

### Root — Modified

| File | Change |
|------|--------|
| `package.json` | Add `"bot"` to workspaces, add `dev:bot` and `deploy-commands` scripts |

### Frontend — Modified (Phase 4)

| File | Change |
|------|--------|
| `frontend/src/pages/ProfilePage.tsx` | Add API Keys management section |
| `frontend/src/services/api.ts` | Add `apiKeys.generate()`, `apiKeys.list()`, `apiKeys.revoke()` methods |

---

## Discord Developer Portal Setup

1. Create application at https://discord.com/developers/applications
2. Create bot user under the application
3. No Privileged Gateway Intents needed (slash commands work without them)
4. Generate OAuth2 invite URL with scopes: `bot`, `applications.commands`
5. Bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

## Deployment

Add to PM2 `ecosystem.config.js`:

```javascript
{
  name: 'whiskey-canon-bot',
  cwd: './bot',
  script: 'dist/index.js',
  instances: 1,
  autorestart: true,
  max_memory_restart: '256M'
}
```

## Development Commands

```bash
# Install all workspace dependencies
npm install

# Run all three services (backend + frontend + bot)
npm run dev

# Run bot only
npm run dev:bot

# Register slash commands with Discord
npm run deploy-commands --workspace=bot

# Build bot for production
npm run build --workspace=bot
```
