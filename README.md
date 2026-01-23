# AppScript Proxy

Express.js proxy server for CoinGecko and Dune API endpoints, built with TypeScript.

## Project Structure

```
.
├── src/                 # TypeScript source files
│   ├── config/          # Configuration files
│   │   └── env.ts       # Environment variables and config
│   ├── controllers/     # Request handlers
│   │   ├── coingeckoController.ts
│   │   └── tvlController.ts
│   ├── middleware/      # Express middleware
│   │   └── auth.ts      # Authentication middleware
│   ├── routes/          # Route definitions
│   │   ├── index.ts     # Main router
│   │   ├── coingecko.routes.ts
│   │   └── tvl.routes.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript (generated)
├── .env                 # Environment variables
├── tsconfig.json        # TypeScript configuration
├── nodemon.json         # Nodemon configuration
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the root directory:

```
API_SECRET=your_api_secret_here
DUNE_API_KEY=your_dune_api_key_here
PORT=3000

# Vercel KV (Redis) - Optional for caching
# Get from your Vercel project settings
KV_REST_API_URL=redis://default:password@host:port
```

### Setting Up Vercel KV Cache

1. **Create a Vercel KV Database:**
   - Go to your [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to **Storage** → **KV Database**
   - Create a new database (or use existing one)

2. **Get Your KV Connection URL:**
   - Copy the `KV_REST_API_URL` from the database settings
   - Add it to your `.env` file
   - Or for Vercel deployments, add it as an environment variable in project settings

3. **How Caching Works:**
   - First request triggers a Dune API call (fetches TVL for ALL networks at once)
   - Results are cached in Redis for **1 hour**
   - Subsequent requests get data from cache instantly
   - After 1 hour, cache expires and fresh data is fetched
   - Perfect for expensive Dune queries!

## Installation

```bash
npm install
```

## Running the Server

```bash
# Build TypeScript
npm run build

# Production (run compiled JavaScript)
npm start

# Development (with auto-reload using nodemon)
npm run dev

# Development (run TypeScript directly with ts-node)
npm run dev:ts

# Watch mode (auto-compile TypeScript on changes)
npm run watch
```

## API Endpoints

### GET /coin/:coingeckoId

Get coin data from CoinGecko API.

**Parameters:**
- `coingeckoId` (path) - CoinGecko coin ID
- `apiSecret` (query) - API authentication secret

**Example:**
```
GET /coin/bitcoin?apiSecret=your_secret
```

### GET /tvl

Get TVL data from Dune API with intelligent caching.

**Parameters:**
- `apiSecret` (query) - API authentication secret (removed - no longer required)
- `network` (query, required) - Blockchain network ('ethereum', 'avalanche_c_chain')

**Example:**
```
GET /tvl?network=ethereum
```

**How it works:**
1. First request fetches TVL for **all networks** from Dune API (expensive call)
2. Results cached in Redis for 1 hour
3. Subsequent requests return cached data instantly (network-specific)
4. Cache auto-refreshes after 1 hour

### GET /health

Health check endpoint.

**Example:**
```
GET /health
```

## Caching Strategy

The TVL endpoint uses **Redis caching via Vercel KV** to minimize expensive Dune API calls:

### How It Works

```
User Request (network=ethereum)
    ↓
Cache Check (Redis)
    ├─ HIT → Return cached data instantly
    └─ MISS → Fetch fresh data from Dune API
         ├─ Call Dune query (returns all networks at once)
         ├─ Parse network-specific data
         ├─ Store in Redis (1 hour TTL)
         └─ Return to user
```

### Caching Details

- **Cache Key:** `tvl_data_all_networks`
- **TTL:** 1 hour (3600 seconds)
- **What's cached:** TVL data for ALL supported networks from a single Dune query
- **Cost savings:** ~99% reduction in API calls for repeated requests

### Manual Cache Management

To invalidate cache programmatically, you can add a route to call `invalidateTVLCache()`:

```typescript
import { invalidateTVLCache } from '../services/cacheService';

router.post('/cache/invalidate', async (req, res) => {
  await invalidateTVLCache();
  res.json({ message: 'Cache invalidated' });
});
```
