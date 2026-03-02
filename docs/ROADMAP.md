# TIX-DAO — Roadmap

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

> This roadmap reflects honest, achievable milestones. Phase 1 is the Solana Graveyard Hackathon MVP. Phases 2–4 represent the production path to a real deployed protocol.

---

## Phase 1 — Hackathon MVP ✅ Current

**Timeline:** Solana Graveyard Hackathon 2026 submission

Everything in this phase is built and running at the demo URL.

### What's Shipped

**Frontend**
- [x] Next.js 16 App Router with full TypeScript and Tailwind 4
- [x] Terminal-aesthetic UI — monochrome black/silver, CRT scanlines, block-character vote bars
- [x] Home screen — graveyard narrative, hero, dead-project table
- [x] Lock Tokens screen — four ve$TICK duration cards (30d 1× · 90d 2× · 180d 3× · 365d 4×), live voting power calc
- [x] Create DAO screen — venue name, quorum %, real 3-TX on-chain deploy (TX1 mint · TX2 realm · TX3 governance+proposal)
- [x] Proposals screen — 3 governance proposals with real on-chain YES/NO voting; each vote creates `VoteRecordV2` PDA on devnet; Explorer tx link shown per vote
- [x] Finance screen — RWA advance calculator (loan amount, repayment, lender yield), draft term sheet (UI only — no on-chain call; TICKS disbursement ships Phase 3)
- [x] Responsive Navbar — window chrome, active route indicators, Wallet Multi Button
- [x] Shared Footer component — Orthonode credit, optional governance note
- [x] Custom 404 page — terminal aesthetic, proper HTTP 404 status
- [x] Per-page metadata via sublayouts — title template `%s | TIX-DAO`
- [x] OG/Twitter Card metadata — social share previews
- [x] robots.txt — allow all crawlers, sitemap reference

**Wallet Integration**
- [x] `@solana/wallet-adapter-react` with Wallet Standard auto-discovery
- [x] Phantom, Solflare, Backpack all work without explicit adapter registration
- [x] `autoConnect` with graceful error handling — no crashes on missing wallet or user rejection
- [x] SSR-safe dynamic import pattern (`WalletWrapper` → `ssr: false`)

**Infrastructure**
- [x] `next.config.ts` webpack fallback for Solana Node.js built-ins + `Buffer`/`process`/`stream` ProvidePlugin polyfills
- [x] `NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID` wired to official SPL-Governance devnet address (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`)
- [x] `src/lib/governance.ts` — env-var constants, network config
- [x] `src/lib/governanceActions.ts` — full on-chain helper: `createTickMint`, `createRealmWithDeposit`, `createGovernanceAndProposal`, `lockTokens`, `castVoteOnProposal`
- [x] `@solana/spl-governance ^0.3.28` — active, wired to all 3 deploy transactions
- [x] `@coral-xyz/anchor ^0.32.1` installed; `bn.js` used for BN arithmetic (browser-safe)
- [x] SES lockdown fix — governance program ID stored as pre-computed `Uint8Array` bytes
- [x] Vercel deployment — live at https://tix-dao.vercel.app

---

## Phase 2 — Production Realms Integration ✅ Complete

**Timeline:** 2026-03-02 (completed)

Phase 1 shipped real on-chain DAO creation (TX1/TX2/TX3), real castVote for all 3 proposals, and real token locking — all confirmed on devnet. Phase 2 adds live account deserialization, the ve$TICK escrow contract, and ecosystem integration.

### Goals

**Live proposal deserialization** ✅
- [x] `getProposal` fetches real on-chain vote tallies from devnet on page load
- [x] WebSocket `onAccountChange` subscription pushes real-time updates as votes come in
- [x] `displayCounts` derived from live on-chain data; falls back to baseline if RPC error
- [x] Boot context shows "fetching live vote counts" → "live on-chain vote tallies loaded"

**$TICK airdrop faucet** ✅
- [x] `/faucet` page added — 2 SOL airdrop via `connection.requestAirdrop`
- [x] Rate-limit detection and error messaging + fallback link to faucet.solana.com
- [x] Linked in Navbar

**Real ve$TICK escrow contract** ✅
- [x] `tick-escrow` Anchor program written and deployed to Solana devnet
- [x] `lock_tokens` instruction: deposits $TICK, creates `EscrowAccount` PDA with `locked_amount`, `lock_end_ts`, `multiplier_bps`
- [x] `unlock_tokens` instruction: validates lock expiry, returns $TICK to owner, closes escrow ATA
- [x] Frontend: `lockTokensEscrow`, `unlockTokensEscrow`, `getEscrowState` in `governanceActions.ts`
- [x] Lock page shows existing escrow state; unlock button appears when lock expires

**Integration with app.realms.today** ✅
- [x] "Open in Realms ↗" link shown in proposals boot context when realm is connected
- [x] `realmAddress` prop on Footer — "View on Realms ↗" link shown on proposals page
- [x] Links point to `https://app.realms.today/dao/{realmAddress}?cluster=devnet`

---

## Phase 3 — KYD Protocol Integration

**Timeline:** Month 3–4

Layer the real-world asset financing capabilities of the TICKS protocol on top of the governance infrastructure from Phase 2.

### Goals

**TICKS Protocol Integration**
Integrate with the KYD (Know Your Degens) TICKS protocol, which models tickets as real-world assets on-chain. Each ticket becomes an RWA with:
- Face value
- Resale cap (enforced by the governance proposal voted in Phase 2)
- Artist royalty rate (also enforced by governance)
- Attendee wallet binding

**Venue Financing via Ticket-Backed Borrowing**
Build the RWA financing interface: venues can borrow against future ticket sale revenue.
- Venue creates a loan request proposal in their DAO
- Token holders vote to approve the terms
- If passed, the venue receives SOL/USDC upfront
- Repayment is automated from ticket sale proceeds via the TICKS program

**DeFi Lender Interface**
Lenders (individuals or DAOs) can browse venue loan requests, see ticket sale history, and commit capital. The TIX-DAO governance proposal acts as the on-chain term sheet.

**Artist Royalty Enforcement**
Governance proposals that set royalty rates are linked directly to TICKS protocol escrow logic. When a ticket is resold on any compliant secondary market, the royalty percentage voted by the DAO is automatically enforced by the escrow program — no manual collection required.

---

## Phase 4 — Mainnet & Ecosystem

**Timeline:** Month 5–6

Launch on Solana mainnet and begin onboarding real venues.

### Goals

**Mainnet Deployment**
- Deploy to Solana mainnet-beta
- Publish `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta` in production environment
- Update RPC to a production-grade provider (Helius or QuickNode dedicated)
- Full security review of all on-chain instructions before mainnet launch

**Venue Onboarding — Target: 10 Independent Venues**
Begin with independent venues (capacity 200–2,000) rather than major operators. Target markets:
- Chicago independent music venues
- Austin live music circuit
- Brooklyn venue ecosystem
Onboarding package: documentation, support Discord, co-marketing in exchange for early adoption.

**$TICK Token Launch**
- Fair launch via LFG launchpad or Jupiter Liquidity Bootstrapping Pool
- Initial supply split: 40% community/governance, 30% venue incentives, 20% team/advisors (4-year vest), 10% treasury
- Listing on major Solana DEXes (Raydium, Orca)

**Realms Plugin Submission**
Submit the ve$TICK voter weight plugin to the official Realms plugin registry. This makes the locking mechanism available to any Realms DAO, not just TIX-DAO venues — expanding the addressable market.

**KYD Production Platform Integration**
Full integration with the production KYD platform at kyd.io. TIX-DAO governance decisions flow directly into the KYD ticketing infrastructure, making on-chain policy enforcement invisible to end users (they just buy and resell tickets normally).

---

## Known Risks

These risks are real and we are not hiding them from potential collaborators or investors.

**Privy/Wallet Dependency**
The current wallet UX requires users to have Phantom or another Wallet Standard browser extension. Mass-market adoption requires a more seamless wallet experience. We plan to integrate Privy or Dynamic for social login in Phase 3, but this introduces a dependency on a third-party custodial system.

**Solana Network Outages**
Solana has experienced multiple network outages historically. A governance vote that completes during an outage could be delayed or require retry logic. The `voting_cool_off_time` buffer partially mitigates this, but persistent outages affecting a vote deadline would require manual intervention from the council.

**Whale Governance Capture**
Even with ve$TICK locking, a sufficiently capitalized actor could accumulate $TICK tokens over 365 days and achieve a governance supermajority. The council veto is a partial mitigation, but the council itself could be captured if council tokens are transferable. Phase 2 will implement non-transferable council tokens and a maximum wallet cap on $TICK for governance purposes.

**Regulatory Uncertainty**
The intersection of governance tokens, ticket resale policy enforcement, and real-world asset financing exists in a regulatory grey zone in most jurisdictions. TIX-DAO is not providing legal advice. Venue operators should consult local counsel before using the protocol for binding venue policy. The hackathon MVP is explicitly a demonstration prototype.

**Smart Contract Risk**
Although we use the audited SPL-Governance program, the ve$TICK escrow contract (Phase 2) and any TICKS integration (Phase 3) will be custom code. These will require a third-party security audit before handling real funds on mainnet.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
