# TIX-DAO — Deployment Guide

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

## 1. Prerequisites

Before you start, ensure the following are installed and available:

| Requirement | Minimum Version | Check |
|---|---|---|
| Node.js | 20.x | `node --version` |
| npm | 9.x | `npm --version` |
| Git | Any | `git --version` |
| Phantom Wallet | Latest | Browser extension at phantom.app |
| Solana CLI (optional) | 1.18+ | `solana --version` |

> **Phantom is required** for the wallet connect flow. Solflare and Backpack also work — the wallet adapter uses Wallet Standard auto-discovery, so any browser wallet that implements the standard will appear automatically.

---

## 2. Getting Devnet SOL

You need devnet SOL to sign transactions on Solana devnet. It has no real-world value.

**Option A — Solana CLI (fastest):**
```bash
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet
```

**Option B — Web faucet:**
Visit [faucet.solana.com](https://faucet.solana.com), paste your wallet address, select Devnet, request 2 SOL.

**Option C — From Phantom directly:**
Open Phantom → switch to Devnet → Settings → Airdrop SOL.

Confirm you received it:
```bash
solana balance YOUR_WALLET_ADDRESS --url devnet
```

---

## 3. Environment Setup

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

> If `.env.local.example` does not exist, create `.env.local` from scratch:

```bash
# .env.local

# Solana network — use 'devnet' for development, 'mainnet-beta' for production
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Official SPL-Governance program address (same on all clusters)
NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID=GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw

# Optional: override the default public RPC with a private endpoint (see Section 6)
# NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

**Variable explanations:**

`NEXT_PUBLIC_SOLANA_NETWORK`
Controls which Solana cluster the wallet adapter connects to. Always `devnet` during development. Changing to `mainnet-beta` without a production RPC will result in rate-limit errors.

`NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID`
The address of the SPL-Governance program deployed by Solana Labs. This is the same address on devnet and mainnet. Do not change it — it is the canonical audited program.

`NEXT_PUBLIC_RPC_ENDPOINT` (optional)
If set, `SolanaWalletProvider` should be updated to read this value instead of `clusterApiUrl(network)`. Enables private RPC endpoints such as Helius (see Section 6).

---

## 4. Local Development

```bash
# 1. Clone the repository
git clone https://github.com/orthonode/tix-dao.git
cd tix-dao

# 2. Install dependencies
# IMPORTANT: --legacy-peer-deps is required.
# @solana/wallet-adapter-* declare peer deps on React 18.
# The project runs React 19 — this flag silences the conflict safely.
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local if needed (defaults work for devnet)

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

> `npm run dev` runs `next dev --webpack`. The `--webpack` flag is required because Next.js 16 defaults to Turbopack, which conflicts with the custom webpack `resolve.fallback` configuration needed by Solana packages. See `next.config.ts` for details.

**Verify it's working:**
1. Open http://localhost:3000 — home page with the graveyard table should load
2. Open http://localhost:3000/create — Create DAO form should render
3. Open http://localhost:3000/proposals — three proposals with vote bars should render
4. Click "Connect Wallet" in the top-right — Phantom modal should open

---

## 5. Vercel Deployment

### 5.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 5.2 Authenticate
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account (GitHub, GitLab, or email).

### 5.3 Initial Deploy
```bash
vercel --prod
```
Answer the interactive prompts:
- **Set up and deploy** → Yes
- **Which scope** → your personal account or team
- **Link to existing project** → No (first time)
- **Project name** → `tix-dao` (or your preferred name)
- **Directory** → `./` (current directory)
- **Override settings** → No

Vercel will detect Next.js automatically and configure build settings. The first deploy takes ~2 minutes.

### 5.4 Add Environment Variables
After the initial deploy, add your env vars:

```bash
vercel env add NEXT_PUBLIC_SOLANA_NETWORK
# When prompted, enter: devnet
# Select environments: Production, Preview, Development

vercel env add NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID
# When prompted, enter: GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw
# Select environments: Production, Preview, Development
```

If using a custom RPC (recommended for production):
```bash
vercel env add NEXT_PUBLIC_RPC_ENDPOINT
# When prompted, enter: https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

### 5.5 Redeploy with Environment Variables
```bash
vercel --prod
```
The redeployment applies the new env vars. You will receive a URL like `https://tix-dao-xyz.vercel.app`.

### 5.6 Verify on Vercel
```bash
vercel ls          # see all deployments
vercel inspect     # inspect the latest deployment
```

---

## 6. Custom RPC Setup

The public Solana devnet RPC (`api.devnet.solana.com`) is rate-limited and unreliable under moderate traffic. For a production demo or hackathon submission, use a private RPC endpoint.

**Helius (recommended — generous free tier):**

1. Create a free account at [helius.dev](https://helius.dev)
2. Create a new devnet app from the dashboard
3. Copy the RPC endpoint URL: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
   ```
5. Update `src/components/WalletProvider.tsx` to use the env var:
   ```typescript
   const endpoint = useMemo(() =>
     process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? clusterApiUrl(network),
   [network]);
   ```

**Other options:**
- **QuickNode** — quicknode.com, free Solana devnet endpoints
- **Alchemy** — alchemy.com, Solana support available
- **Triton** — rpcpool.com, used by many Solana protocols

---

## 7. Verify Deployment

After deploying (locally or to Vercel), run through this checklist:

- [ ] Home page loads at `/` with the graveyard table visible
- [ ] Navbar shows `TIX-DAO_`, `$ ./create-dao`, `$ ./proposals` links
- [ ] "Connect Wallet" button appears in the top-right
- [ ] Clicking "Connect Wallet" opens the wallet modal (Phantom/Solflare listed)
- [ ] Connecting Phantom switches button to show truncated address
- [ ] `/create` loads the Create DAO form
- [ ] Without wallet: yellow warning "WALLET NOT CONNECTED" appears
- [ ] With wallet: token mint field shows truncated public key
- [ ] Entering a venue name and clicking deploy: log lines stream, success screen appears
- [ ] `/proposals` loads three proposals with block-character progress bars
- [ ] Without wallet: "connect wallet to cast your vote" hint appears
- [ ] With wallet: clicking `[ Vote Yes ]` updates the bar and locks the button

---

## 8. Troubleshooting

### `Module not found: Can't resolve 'fs'`
**Cause:** Solana packages import Node.js built-ins that don't exist in browser bundles.
**Fix:** Ensure `next.config.ts` contains the webpack fallback:
```typescript
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, os: false, path: false, crypto: false,
    };
  }
  return config;
},
```
Also confirm you are running `next dev --webpack` (not `next dev` which uses Turbopack in Next.js 16).

---

### Hydration error: `Text content does not match server-rendered HTML`
**Cause:** Wallet adapter code runs in the browser but Next.js also attempts a server render, producing a mismatch.
**Fix:** Confirm `WalletWrapper.tsx` uses `dynamic()` with `ssr: false`:
```typescript
const WalletProvider = dynamic(
  () => import('./WalletProvider'),
  { ssr: false }
);
```
And confirm `layout.tsx` imports `WalletWrapper` (not `WalletProvider` directly).

---

### Wallet not connecting / "no wallet found"
**Cause 1:** Phantom is not installed.
**Fix:** Install Phantom from [phantom.app](https://phantom.app).

**Cause 2:** Phantom is set to Mainnet but the app is on Devnet.
**Fix:** In Phantom → Settings → Developer Settings → Switch to Devnet.

**Cause 3:** `autoConnect` is racing with the wallet initializing.
**Fix:** Already handled in `WalletProvider.tsx` via the `onError` callback that silently swallows `WalletNotReadyError` and "already pending" errors.

---

### Transaction fails with "Attempt to debit an account but found no record of a prior credit"
**Cause:** The connected wallet has 0 devnet SOL and cannot pay transaction fees.
**Fix:** Airdrop devnet SOL (see Section 2).
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

---

### CORS error when connecting to RPC
**Cause:** You are using `http://localhost:8899` (local validator) as the RPC endpoint in a deployed Vercel app, or using an endpoint that blocks browser requests.
**Fix:** Use `api.devnet.solana.com` or a Helius/QuickNode endpoint. Never use `localhost` as RPC in a deployed environment. Confirm `NEXT_PUBLIC_RPC_ENDPOINT` is set to a publicly accessible URL.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
