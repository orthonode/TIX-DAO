# TIX-DAO — Architecture

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

## 1. System Overview

TIX-DAO is a purpose-built governance interface for live-event venues, deployed on top of Solana's SPL-Governance (Realms) protocol. Venue operators, artists, and token-holding fans use it to propose and vote on ticketing policy — resale price caps, royalty percentages on secondary sales, and refund windows — entirely on-chain. Each venue deploys its own Realm on Solana devnet, creating an isolated governance namespace backed by the audited `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw` program, so no custom smart-contract code is required to achieve binding, executable governance.

---

## 2. Why Realms

SPL-Governance is Solana Labs' canonical governance program. Choosing it over a custom program gives TIX-DAO three concrete advantages:

| Consideration | Custom Program | SPL-Governance (Realms) |
|---|---|---|
| Audit status | Unaudited | Audited by Solana Labs |
| Dev time | Weeks | Hours (SDK + CLI) |
| Flash-loan surface | Depends on design | Blocked by lock periods |
| Ecosystem | Isolated | Works with app.realms.today |
| Composability | Custom | Any Realms plugin works |

SPL-Governance already implements proposal lifecycle (Draft → Voting → Succeeded/Defeated → Executing → Completed), vote weight calculation, veto authority, council multi-sig, and cooloff periods. TIX-DAO layers a vertically-focused UI on top of this battle-tested primitive rather than reinventing it.

---

## 3. Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Next.js 16 App Router (localhost:3000)           │  │
│  │                                                               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │  /        │  │  /lock   │  │  /create    │  │/proposals│  │ /finance │  │  │
│  │  │  Home     │  │  ve$TICK │  │  Create DAO │  │  Vote    │  │  RWA     │  │  │
│  │  │ page.tsx  │  │ page.tsx │  │  page.tsx   │  │ page.tsx │  │ page.tsx │  │  │
│  │  └──────────┘  └──────────┘  └─────────────┘  └──────────┘  └──────────┘  │  │
│  │                                                               │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │         WalletWrapper (Client Component, ssr:false)    │   │  │
│  │  │  ┌───────────────────────────────────────────────────┐ │   │  │
│  │  │  │  SolanaWalletProvider                             │ │   │  │
│  │  │  │  ConnectionProvider → clusterApiUrl('devnet')     │ │   │  │
│  │  │  │  WalletProvider → autoConnect, onError handler    │ │   │  │
│  │  │  │  WalletModalProvider                              │ │   │  │
│  │  │  └───────────────────────────────────────────────────┘ │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│            │ Wallet Standard               │ JSON-RPC               │
│            ▼                               ▼                        │
│  ┌───────────────────┐         ┌──────────────────────┐            │
│  │  Browser Wallet   │         │  Solana Devnet RPC   │            │
│  │  (Phantom /       │         │  api.devnet.solana   │            │
│  │   Solflare /      │         │  .com                │            │
│  │   Backpack)       │         └──────────┬───────────┘            │
│  └───────────────────┘                    │                        │
└───────────────────────────────────────────┼────────────────────────┘
                                            │ On-chain
                                            ▼
┌───────────────────────────────────────────────────────────────────┐
│              SOLANA DEVNET — SPL-GOVERNANCE PROGRAM               │
│          GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                         Realm PDA                           │ │
│  │                  (one per venue / DAO)                      │ │
│  │                                                             │ │
│  │  ┌──────────────────────┐  ┌──────────────────────────┐    │ │
│  │  │  Community Governance│  │   Council Governance     │    │ │
│  │  │  Token: $TICK        │  │   Token: Council NFT     │    │ │
│  │  │  Quorum: configurable│  │   Multi-sig veto power   │    │ │
│  │  │                      │  │                          │    │ │
│  │  │  ┌────────────────┐  │  └──────────────────────────┘    │ │
│  │  │  │ ProposalV2 PDA │  │                                   │ │
│  │  │  │ VoteRecordV2   │  │  ┌──────────────────────────┐    │ │
│  │  │  │ TokenOwner     │  │  │   Native Treasury         │    │ │
│  │  │  │ Record PDA     │  │  │   (SOL + SPL tokens)      │    │ │
│  │  │  └────────────────┘  │  └──────────────────────────┘    │ │
│  │  └──────────────────────┘                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## 4. Program Architecture — SPL-Governance Accounts

SPL-Governance uses a set of Program Derived Addresses (PDAs) to model the full lifecycle of on-chain governance. TIX-DAO targets the following account types:

### `Realm`
The top-level PDA for a governance organization. Seeded by `[b"governance", realm_name]`. Stores:
- `community_mint` — the $TICK governance token mint
- `council_mint` — optional council token for veto/emergency powers
- `voting_proposal_count` — active proposals
- `config` — min community weight to create proposals, council weight

### `GovernanceAccount`
Scoped to a single governance "module" within the Realm (e.g., the Community Governance that controls ticketing policy). Stores:
- `governance_seed` — the governed account (treasury, program, etc.)
- `config.vote_tipping` — `Strict` / `Early` / `Disabled`
- `config.voting_cool_off_time` — 7 days in TIX-DAO's security model
- `config.deposit_exempt_proposal_count`

### `ProposalV2`
One PDA per governance proposal. Stores:
- `name` — e.g., "Cap resale price at 150% of face value"
- `description_link` — IPFS or Arweave URL for full description
- `state` — `Draft | Voting | Succeeded | Defeated | Executing | Completed | Cancelled | Vetoed`
- `vote_type` — `SingleChoice` or `MultiChoice`
- `options` — array of `ProposalOption` (Approve / Deny)
- `deny_vote_weight` — running tally of NO votes
- `voting_at` / `voting_completed_at` — timestamps

### `VoteRecordV2`
One PDA per wallet per proposal. Seeded by `[b"governance", proposal, token_owner_record]`. Prevents double-voting. Stores:
- `voter_weight` — weight at time of vote (snapshot)
- `vote` — the actual choice made

### `TokenOwnerRecord`
One PDA per wallet per Realm. Tracks a user's governance participation:
- `governing_token_deposit_amount` — tokens locked in governance
- `unrelinquished_votes_count` — active votes outstanding
- `outstanding_proposal_count` — proposals this user has open
- `governance_delegate` — optional delegate address

---

## 5. ve$TICK Token Model

The ve$TICK (vote-escrowed $TICK) model gives long-term stakeholders — fans and artists who are genuinely invested in a venue — disproportionately higher voting power than short-term holders who could otherwise exploit governance via flash loans or coordinated dumps.

| Lock Duration | Multiplier | Use Case |
|---|---|---|
| No lock (liquid) | 0× (no governance rights) | Trading only |
| 30 days | 1× | Casual venue supporter |
| 90 days | 2× | Season ticket holder |
| 180 days | 3× | Artist / promoter partner |
| 365 days | 4× | Core venue stakeholder |

**How it works in Phase 2:**
1. User deposits $TICK into a ve$TICK escrow contract
2. They choose a lock duration (30–365 days)
3. The escrow mints a non-transferable receipt token representing their voting weight
4. SPL-Governance's `voter_weight` plugin reads the receipt token balance to determine vote weight
5. Lock expires → user can withdraw $TICK, receipt burns, voting power returns to zero

This design is analogous to Curve Finance's veCRV but purpose-built for Solana's SPL-Governance voter weight plugin interface.

---

## 6. Security Design

### Flash Loan Attack Protection
The $182M Beanstalk exploit in April 2022 succeeded because an attacker borrowed a governance supermajority via flash loan, passed a malicious proposal, and drained the treasury — all within a single transaction. TIX-DAO's governance config prevents this via:

1. **Minimum lock period** — governance tokens must be deposited for at least 30 days before they carry voting weight. Flash loans cannot satisfy a 30-day lock.
2. **7-day voting cooloff** — `governance_config.voting_cool_off_time = 7 days`. After a proposal passes quorum, there is a 7-day window before execution during which the council can veto. This means even if an attacker accumulates tokens over 30 days, they still cannot execute malicious proposals instantly.
3. **Council veto** — a multi-sig council account holds veto power over the community governance, providing a last-resort circuit breaker.

### Snapshot Voting
Vote weight is captured at the time `castVote` is called, not at proposal creation. This means selling tokens after voting does not reduce a user's already-cast vote weight. Combined with lock periods, this prevents vote-then-dump manipulation.

### Single Realm Pattern
Each venue deploys exactly one Realm with one Community Governance and one Council Governance. There is no cross-Realm delegation. This isolates governance blast radius — a compromised Realm cannot affect other venues.

---

## 7. Data Flow

### Create DAO
```
User fills form (venue name, quorum %)
  → TX1: wallet.sendTransaction → mints fresh $TICK SPL token
  → TX2: wallet.sendTransaction → createRealm + depositGoverningTokens (TokenOwnerRecord PDA)
  → TX3: wallet.sendTransaction → createGovernance + createProposal + signOffProposal
  → UI shows "DAO DEPLOYED" with all 3 transaction signatures + account links
```
> **Live on devnet.** All three transactions are real SPL-Governance CPI calls confirmed on Solana devnet. Each deploy creates a unique realm by appending the mint address suffix to the venue name, preventing PDA collisions on repeat deploys.

### Create Proposal
```
DAO member with TokenOwnerRecord
  → wallet.sendTransaction(createProposalInstruction)
  → SPL-Governance: creates ProposalV2 PDA (state: Draft)
  → DAO member signs addSignatory instruction
  → DAO member signs signOffProposal instruction
  → ProposalV2 state: Voting (voting period begins)
```

### Vote
```
Token holder visits /proposals
  → UI reads ProposalV2 accounts from devnet
  → User clicks Vote Yes / Vote No
  → wallet.sendTransaction(castVoteInstruction)
  → SPL-Governance: creates VoteRecordV2 PDA (prevents re-vote)
  → ProposalV2 vote tallies update on-chain
  → If quorum reached: state → Succeeded (after cooloff)
```
> **Phase 2:** Live castVote CPI is planned for Phase 2. The `/proposals` page currently reads from mock data seeded by the Create DAO flow; real account deserialization via `getGovernanceAccounts` ships in Phase 2.

### Execute Proposal
```
After voting_cool_off_time elapses
  → Any wallet signs executeTransaction instruction
  → SPL-Governance: runs the instruction stored in ProposalTransaction account
  → ProposalV2 state: Completed
  → On-chain policy is now enforced by the program
```

---

## 8. Frontend Architecture

### App Router Structure
```
src/app/
  layout.tsx                  → Server Component — exports metadata (OG, Twitter), renders <html>
  not-found.tsx               → Server Component — exports 404 metadata, delegates to NotFoundClient
  NotFoundClient.tsx          → Client Component — interactive 404 page with hover effects
  page.tsx                    → Client Component — Home screen (graveyard + hero)
  create/
    layout.tsx                → Server Component — per-page metadata (title: "Create Venue DAO")
    page.tsx                  → Client Component — Create DAO form with live deploy log
  proposals/
    layout.tsx                → Server Component — per-page metadata (title: "Proposals")
    page.tsx                  → Client Component — Proposals + voting (block-bar UI)
  lock/
    layout.tsx                → Server Component — per-page metadata (title: "Lock Tokens — ve$TICK")
    page.tsx                  → Client Component — ve$TICK lock duration + voting power calc
  finance/
    layout.tsx                → Server Component — per-page metadata (title: "Venue Finance — RWA Advance")
    page.tsx                  → Client Component — RWA advance calculator + mock term sheet
```

### SSR Safety Pattern
Solana wallet adapters use browser-only APIs (`window.solana`, `localStorage`). Next.js App Router renders Server Components on the server where these APIs do not exist. The solution is a two-component pattern:

```
layout.tsx (Server Component)
  └── WalletWrapper (Client Component, 'use client')
        └── dynamic(() => import('./WalletProvider'), { ssr: false })
              └── SolanaWalletProvider (Client Component)
                    ├── ConnectionProvider
                    ├── WalletProvider (autoConnect, onError)
                    └── WalletModalProvider
```

`WalletWrapper` is the critical indirection layer: it is a Client Component (safe for `dynamic`/`ssr:false`), while `layout.tsx` stays a Server Component (required for `export const metadata`).

### Webpack Configuration
Next.js 16 defaults to Turbopack. TIX-DAO uses `--webpack` explicitly because `@solana/web3.js` and the wallet adapter packages reference Node.js built-ins (`fs`, `os`, `path`, `crypto`) that do not exist in browser bundles. The `next.config.ts` webpack callback sets `resolve.fallback` for each to `false`, telling webpack to omit them from the client bundle rather than throw.

### Environment Variables
| Variable | Value | Used in |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | `WalletProvider` network selection |
| `NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID` | `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw` | `src/lib/governance.ts` |

---

## 9. Current Status (as of 2026-03-01)

| Feature | Status | Notes |
|---|---|---|
| Wallet connection | ✅ Real | Wallet Standard auto-discovery |
| Devnet RPC connection | ✅ Real | via `clusterApiUrl('devnet')` |
| $TICK token mint (TX1) | ✅ Real | Fresh SPL mint per deploy; confirmed on devnet |
| DAO creation — createRealm (TX2) | ✅ Real | Real SPL-Governance CPI; TokenOwnerRecord PDA created |
| DAO creation — createGovernance + createProposal (TX3) | ✅ Real | All three instructions in one confirmed devnet tx |
| Proposal loading | ⚠️ Seeded | Proposal PDA created on-chain; UI reads from create flow state; full deserialization via `getGovernanceAccounts` ships Phase 2 |
| Casting votes | ⚠️ Phase 2 | React state only; real `castVote` CPI ships Phase 2 |
| ve$TICK lock UI | ⚠️ Phase 2 | Lock duration cards are live; escrow contract ships Phase 2 |
| RWA advance | ⚠️ Phase 3 | Calculator live; TICKS protocol integration ships Phase 3 |
| Real treasury | ⚠️ Phase 2 | NativeTreasury PDA auto-created by Realms; explicit management UI ships Phase 2 |
| Council multi-sig | ⚠️ Phase 2 | Planned for Phase 2 |

`@solana/spl-governance ^0.3.28` and `@coral-xyz/anchor ^0.32.1` are already installed and active.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
