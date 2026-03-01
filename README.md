
<div align="center">

# 🪦 TIX-DAO

**Venue governance on-chain. Ticketing reclaimed.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./docs/HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

</div>

---

> **Ticketmaster is a bank that sells tickets on the side. TIX-DAO is governance infrastructure that puts that power back in the hands of artists and fans.**

---

## Demo

**Live:** [https://tix-dao.vercel.app](https://tix-dao.vercel.app)

[![TIX-DAO Demo](https://img.shields.io/badge/▶_Watch_Demo-YouTube-red.svg)](https://youtu.be/DAG3S8uOmeE)

---

## The Problem

Live Nation posted **record revenue of $23.1 billion in 2024** — up from $22.7 billion in 2023. The DOJ filed an antitrust suit against Live Nation/Ticketmaster in May 2024; the jury trial was scheduled to begin **March 2, 2026**. The court rejected Live Nation's bid for full dismissal in February 2026. The case has not yet produced a verdict.

Service fees, dynamic pricing, resale margins, and royalty decisions are made unilaterally by the platform. Ticketmaster's fees average **27% of ticket face value** (GAO report). Artists have no governance rights over secondary sales of their own work. Fans have no recourse when refund policies change overnight.

The global live events industry was valued at approximately **$88 billion in 2025**. The governance of that money — who gets what percentage, enforced how — is controlled by two or three centralized platforms.

| Before TIX-DAO | With TIX-DAO |
|---|---|
| Resale caps set by Ticketmaster | Voted on-chain by token holders |
| Artist royalties bypassed by marketplaces | Enforced at escrow level by governance proposal |
| Refund windows changed without notice | 72hr window passed as a binding on-chain proposal |
| Platform governance: call customer support | Protocol governance: cast your vote |
| Flash loans can capture governance in one block | 30-day lock + 7-day cooloff makes it structurally impossible |

---

## The Graveyard

Four projects tried to fix this. All four failed. Here is what killed them and how TIX-DAO addresses each failure:

| Project | Failure Year | Cause of Failure | TIX-DAO Fix |
|---|---|---|---|
| **YellowHeart** | 2022 | Royalty bypass — Magic Eden made royalties optional (Oct 2022); artists earned nothing on secondary sales | SPL-Governance proposal enforces royalty at escrow level; no marketplace opt-out |
| **TokenProof** | 2024 | Ethereum L1 gas — $30–50/verification made the economics impossible at scale; acquired by Yuga Labs Dec 2024, original mission abandoned | Solana: base fee ~$0.0005/tx at current prices; 100K verifications ≈ $50 vs $3M+ on ETH L1 |
| **GET Protocol** | Ongoing | No real governance — rebranded as OPEN Ticketing Ecosystem; foundation still controls all policy decisions; token holders have no meaningful vote | $TICK token-weighted on-chain voting; every policy decision is a ProposalV2 on devnet |
| **Beanstalk** | 2022 | $182M flash loan attack — no lock period, no cooloff, no veto; treasury drained in one transaction | 30-day minimum lock + 7-day cooloff + council veto; attack is architecturally impossible |

---

## The Solution

TIX-DAO is a purpose-built governance UI for live-event venues on top of Solana's [SPL-Governance (Realms)](https://realms.today) protocol. Each venue deploys its own Realm via three real on-chain transactions. Token holders vote on ticketing policy. Policy executes on-chain.

### The Canonical Governance Flow (Live on Devnet)

```typescript
// TX1 — mint fresh $TICK SPL token
const { mintKeypair } = await createTickMint(connection, wallet);

// TX2 — deploy Realm + create TokenOwnerRecord PDA
const { realmPk } = await createRealmWithDeposit(connection, wallet, name, mintKeypair.publicKey);

// TX3 — create Governance + Proposal + sign off (starts voting period)
const { governancePk, proposalPk } = await createGovernanceAndProposal(
  connection, wallet, realmPk, mintKeypair.publicKey, proposalTitle, quorumPct,
);
```

All three transactions are confirmed on Solana devnet. `@solana/spl-governance ^0.3.28` is wired and active.

> **Note on SES lockdown:** Phantom's `lockdown-install.js` corrupts `bs58` at runtime, breaking `new PublicKey(string)`. TIX-DAO uses pre-computed `Uint8Array` bytes for `GOVERNANCE_PROGRAM_ID` to avoid this. See [`docs/ARCHITECTURE.md §8`](./docs/ARCHITECTURE.md) for details.

---

## Prize Tracks

| Track | Sponsor | Why We Win |
|---|---|---|
| **Realms Governance Builders** | Realms | First vertical governance UI for live events; real SPL-Governance TX1/TX2/TX3 confirmed on devnet; no custom program |
| **Realms Extensions** | Realms | ve$TICK voter weight plugin — reusable by any Realms DAO, not just TIX-DAO venues |
| **kyd. Ticketing** | kyd. | Governance layer + RWA financing pipeline on top of TICKS protocol |

Full alignment: [`docs/HACKATHON.md`](./docs/HACKATHON.md)

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                       USER BROWSER                             │
│                                                                │
│  Next.js 16 App Router  (/  ·  /create  ·  /proposals  ·  /lock  ·  /finance)  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  WalletWrapper (Client Component, ssr: false)          │    │
│  │    SolanaWalletProvider                                │    │
│  │      ConnectionProvider → clusterApiUrl('devnet')     │    │
│  │      WalletProvider (autoConnect + silent onError)    │    │
│  └────────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────┬─────────────────┘
                       │ Wallet Standard        │ JSON-RPC
                       ▼                        ▼
            ┌─────────────────────┐   ┌──────────────────────┐
            │  Phantom / Solflare │   │  Solana Devnet RPC   │
            │  / Backpack         │   │  api.devnet.solana   │
            │  (auto-discovered)  │   │  .com                │
            └─────────────────────┘   └──────────┬───────────┘
                                                 │
                                                 ▼
┌────────────────────────────────────────────────────────────────┐
│              SPL-GOVERNANCE PROGRAM  (DEVNET)                  │
│          GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw         │
│                                                                │
│  Realm PDA  ("House of Blues Chicago-AbCd12")                  │
│  ├── Community Governance  ($TICK · 20% quorum · 7d cooloff)  │
│  │   └── ProposalV2 PDAs  (resale cap · royalty · refund)     │
│  │       └── VoteRecordV2 PDAs  (one per voter)               │
│  └── Council Governance  (veto authority · multi-sig)         │
│      └── NativeTreasury PDA                                    │
└────────────────────────────────────────────────────────────────┘
```

Full diagram + account breakdown: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

---

## Quick Start

```bash
# Clone
git clone https://github.com/orthonode/TIX-DAO.git
cd tix-dao

# Install
# --legacy-peer-deps required: React 19 conflicts with wallet adapter peer deps
npm install --legacy-peer-deps

# Configure
cp .env.local.example .env.local
# Defaults work for devnet — no edits needed

# Run
npm run dev
# → http://localhost:3000
```

> `npm run dev` runs `next dev --webpack`. The `--webpack` flag is required because Next.js 16 defaults to Turbopack, which conflicts with the Node.js polyfill config required by `@solana/web3.js`.

Full guide — Vercel deploy, custom RPC, troubleshooting: [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)

---

## Features

**Home (`/`)**
- [x] Graveyard narrative — failed-projects table with cause of failure and TIX-DAO counter-measure
- [x] Hero section with governance CTA
- [x] Terminal boot-sequence aesthetic with CRT scanlines

**Lock Tokens (`/lock`)**
- [x] Four lock-duration cards — 30d (1×) · 90d (2×) · 180d (3×) · 365d (4×) — click to select
- [x] $TICK amount input with live ve$TICK voting power display (`amount × multiplier`)
- [x] 2-second loading state → ✅ success state with exact numbers

**Create DAO (`/create`)**
- [x] Venue name + quorum threshold configuration
- [x] **Real 3-transaction on-chain deploy**: TX1 mint $TICK · TX2 create Realm + TokenOwnerRecord · TX3 create Governance + Proposal + sign off
- [x] Live deploy log streams line-by-line for each transaction
- [x] Success screen with all 3 tx signatures linked to Solana Explorer (devnet)
- [x] Shareable proposals URL generated with realm/governance/proposal/mint address params

**Proposals (`/proposals`)**
- [x] Three live governance proposals (resale cap · royalty · refund window)
- [x] Block-character `█░` progress bars — YES/NO split live
- [x] Vote YES / Vote No — one wallet, one vote, locked after cast
- [x] ACTIVE / PASSED status badges

**Finance (`/finance`)**
- [x] Expected ticket revenue + advance % inputs
- [x] Live calculation of loan amount, repayment, and lender yield (3.5% origination)
- [x] Request Advance → mock term sheet with TICKS protocol collateral parameters

**Infrastructure**
- [x] Real SPL-Governance CPI calls — `withCreateRealm`, `withDepositGoverningTokens`, `withCreateGovernance`, `withCreateProposal`, `withSignOffProposal`
- [x] SES lockdown fix — governance program ID stored as pre-computed `Uint8Array` bytes
- [x] Wallet Standard auto-discovery — Phantom, Solflare, Backpack with no explicit registration
- [x] `autoConnect` with silent error handling — no crash on missing wallet or user rejection
- [x] SSR-safe wallet provider (`WalletWrapper` → `ssr: false` dynamic import)
- [x] Webpack polyfills — `Buffer`, `process`, `stream` (ProvidePlugin) + `fs`, `os`, `path`, `crypto` (fallback)
- [x] TypeScript strict mode throughout

---

## ve$TICK Token Model

The ve$TICK (vote-escrowed $TICK) model rewards long-term stakeholders. Flash loan attacks require a 30-day minimum lock — making governance capture by borrowed capital structurally impossible (as proven by the $182M Beanstalk attack on Ethereum in April 2022).

| Lock Duration | Multiplier | Voter Profile |
|---|---|---|
| No lock | 0× | Trading only — no governance rights |
| 30 days | 1× | Casual venue supporter |
| 90 days | 2× | Season ticket holder |
| 180 days | 3× | Artist / promoter partner |
| 365 days | 4× | Core venue stakeholder |

Implemented as a Realms Voter Weight plugin — reusable by any DAO on the Realms ecosystem. Details: [`docs/ARCHITECTURE.md §5`](./docs/ARCHITECTURE.md)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.1.6 |
| Language | TypeScript | 5.x |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Blockchain | Solana | Devnet |
| Governance | SPL-Governance | 0.3.28 |
| Wallet | @solana/wallet-adapter-react | 0.15.39 |
| Wallet UI | @solana/wallet-adapter-react-ui | 0.9.39 |
| RPC client | @solana/web3.js | 1.98.4 |
| Smart contracts | @coral-xyz/anchor | 0.32.1 |
| Deployment | Vercel | — |

---

## Project Structure

```
tix-dao/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              Server Component — metadata, OG/Twitter tags, WalletWrapper
│   │   ├── globals.css             Terminal theme, CRT scanlines, wallet overrides
│   │   ├── not-found.tsx           Custom 404 — server component with metadata
│   │   ├── NotFoundClient.tsx      Client component — interactive 404 page
│   │   ├── page.tsx                Home — graveyard narrative + hero
│   │   ├── create/
│   │   │   ├── layout.tsx          Per-page metadata (title: "Create Venue DAO")
│   │   │   └── page.tsx            Create DAO — 3-TX on-chain deploy with live log
│   │   ├── proposals/
│   │   │   ├── layout.tsx          Per-page metadata (title: "Proposals")
│   │   │   └── page.tsx            Proposals — block-bar voting UI
│   │   ├── lock/
│   │   │   ├── layout.tsx          Per-page metadata (title: "Lock Tokens — ve$TICK")
│   │   │   └── page.tsx            Lock Tokens — ve$TICK duration selector + power calc
│   │   └── finance/
│   │       ├── layout.tsx          Per-page metadata (title: "Venue Finance — RWA Advance")
│   │       └── page.tsx            Finance — RWA advance calculator + mock term sheet
│   │
│   ├── components/
│   │   ├── WalletProvider.tsx      Solana context — autoConnect + silent onError
│   │   ├── WalletWrapper.tsx       Client Component wrapper for ssr:false
│   │   ├── Navbar.tsx              Terminal nav — window chrome + WalletMultiButton
│   │   ├── ProposalCard.tsx        Reusable proposal card — BlockBar, VoteBtn, props interface
│   │   └── Footer.tsx              Shared footer — Orthonode credit, optional vote note
│   │
│   └── lib/
│       ├── governance.ts           Env-var constants — GOVERNANCE_PROGRAM_ID, NETWORK
│       └── governanceActions.ts    On-chain helpers — createTickMint, createRealmWithDeposit,
│                                   createGovernanceAndProposal, lockTokens, castVoteOnProposal
│
├── public/
│   └── robots.txt                  Allow all crawlers + sitemap reference
│
├── docs/
│   ├── ARCHITECTURE.md             Full technical architecture
│   ├── AUDIT.md                    Security audit report (2026-02-27, zero findings)
│   ├── CHANGELOG.md                Detailed changelog
│   ├── DEPLOYMENT.md               Local dev, Vercel, custom RPC, troubleshooting
│   ├── ROADMAP.md                  4-phase roadmap with honest risks
│   ├── CONTRIBUTING.md             Branch strategy, commit convention, PR process
│   ├── SECURITY.md                 Threat model, flash loan protection, disclosure
│   ├── TERMS.md                    Terms of use and disclaimer
│   ├── PRIVACY.md                  Privacy policy — no data collected
│   └── HACKATHON.md                Judges brief — narrative, track alignment, checklist
│
├── CHANGELOG.md                    Root changelog (links to docs/CHANGELOG.md)
├── CONTRIBUTING.md                 Root contributing guide (links to docs/CONTRIBUTING.md)
├── ROADMAP.md                      Root roadmap summary (links to docs/ROADMAP.md)
├── SECURITY.md                     Root security policy (links to docs/SECURITY.md)
├── next.config.ts                  Webpack fallback + ProvidePlugin polyfills
├── tailwind.config.ts              Tailwind CSS 4.x content paths
├── .env.local                      SOLANA_NETWORK + GOVERNANCE_PROGRAM_ID
├── .env.local.example              Template — copy to .env.local
├── package.json                    All deps including @solana/spl-governance
├── tsconfig.json                   TypeScript strict mode
├── README.md                       This file
└── LICENSE                         MIT 2026
```

---

## Roadmap

| Phase | Timeline | Focus |
|---|---|---|
| **Phase 1 — MVP** | Hackathon ✅ | Full UI, real on-chain TX1/TX2/TX3, wallet integration, deployed |
| **Phase 2 — Real Voting** | Month 1–2 | Real `castVote` CPI, live proposal deserialization, $TICK faucet, ve$TICK escrow |
| **Phase 3 — KYD Integration** | Month 3–4 | TICKS RWA protocol, venue financing, artist royalty enforcement |
| **Phase 4 — Mainnet** | Month 5–6 | Mainnet launch, 10 venue onboarding, $TICK token launch |

Full roadmap with goals, code targets, and known risks: [`docs/ROADMAP.md`](./docs/ROADMAP.md)

---

## Contributing

Contributions for Phase 2 on-chain integration are welcome. Read the guide first:

- [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md) — branch strategy, commit convention, PR process, code standards
- Branch from `develop`, not `main`
- `npm run build` must pass before any PR is reviewed

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

<div align="center">

*"Dead projects had the right ideas. We have the right stack."*

**— Orthonode Infrastructure Labs**

[orthonode.xyz](https://orthonode.xyz) · [@OrthonodeSys](https://twitter.com/OrthonodeSys) · Bhopal, Madhya Pradesh, India

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms*
*by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*

</div>
