# TIX-DAO — Changelog

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

All notable changes to TIX-DAO are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

- Council multi-sig deployment (Phase 3)
- TICKS protocol RWA integration — real advance disbursement (Phase 3)
- Mainnet launch (Phase 4)

---

## [2.0.0] — 2026-03-02 — Phase 2: Live Deserialization, Escrow Program, Faucet

### Added
- **ve$TICK Anchor escrow program** — `tick-escrow/` workspace: `lock_tokens` + `unlock_tokens` instructions, `EscrowAccount` PDA with `locked_amount`, `lock_end_ts`, `multiplier_bps`, `bump`; deployed to Solana devnet
- **Live proposal deserialization** — `proposals/page.tsx` now fetches real vote tallies via `getProposal` on mount; WebSocket `onAccountChange` subscription provides real-time count updates; falls back to BASELINE on RPC error
- **`/faucet` page** — 2 SOL devnet airdrop via `connection.requestAirdrop`; rate-limit detection with fallback link to faucet.solana.com; linked in Navbar
- **Realms ecosystem links** — "Open in Realms ↗" in proposals boot context; "View on Realms ↗" in Footer via new `realmAddress` prop; both link to `app.realms.today/dao/{realm}?cluster=devnet`
- **Escrow state panel on `/lock`** — on wallet connect, checks existing `EscrowAccount` PDA; shows locked amount, multiplier, unlock date, status; unlock button appears when lock expires
- **`lockTokensEscrow` + `unlockTokensEscrow` + `getEscrowState`** — three new functions in `governanceActions.ts` replacing SPL-Governance deposit with real Anchor escrow CPI
- **`src/lib/tick_escrow_idl.json`** — Anchor IDL for the tick-escrow program
- **`TICK_ESCROW_PROGRAM_ID` + `TICK_ESCROW_PROGRAM_ID_BYTES`** in `governance.ts`
- **`NEXT_PUBLIC_TICK_ESCROW_PROGRAM_ID`** env var added to `.env.local`

### Changed
- `lock/page.tsx` — uses `lockTokensEscrow` (Anchor CPI) instead of `lockTokens` (SPL-Governance deposit); escrow panel added above lock option cards; `hasParams` no longer requires `realm` param (only `mint` needed for escrow)
- `proposals/page.tsx` — `displayCounts` derived from live on-chain data; `useEffect` x2 (fetch + WebSocket); Realms link in boot context; Footer receives `realmAddress` prop
- `Footer.tsx` — added `realmAddress?: string` prop; renders Realms link above existing footer text when provided
- `Navbar.tsx` — added `/faucet` between `/lock` and `/finance`
- `package.json` — version `1.2.0` → `2.0.0`

---

## [1.2.0] — 2026-03-01 — Real On-Chain Voting, All Simulations Removed

### Added
- **Real castVote for all 3 proposals** — `castVoteOnProposal` wired to `/proposals` page; each vote calls `withCastVote` and creates a `VoteRecordV2` PDA on Solana devnet
- Per-proposal Explorer tx link shown in UI after successful vote
- Per-proposal loading, error, and txSig state (independent for each of the 3 proposals)
- `NoDAO` fallback component shown on `/proposals` when no URL params present (redirects to `/create`)
- `STANDARD_PROPOSALS` exported constant — same proposal titles used in TX3 creation and proposals UI
- TX3 now creates and signs off all 3 proposals in a single transaction (was 1 proposal before)
- Shareable URL now includes `p1`, `p2`, `p3` params for all 3 proposal PDAs
- Create DAO success screen shows all 3 proposal accounts with individual Explorer links

### Changed
- `proposals/page.tsx` — complete rewrite: removes `MOCK_PROPOSALS`; reads all 3 proposal PDAs from URL params; `castVoteOnProposal` called per-proposal
- `finance/page.tsx` — removed `setTimeout(1800)` simulation; `handleRequest` is now synchronous (pure calculator, no on-chain call needed)
- `create/page.tsx` — updated `SuccessState` to `proposalPks: [string, string, string]`; updated shareable URL and accounts display

### Fixed
- Finance page: fake async loading delay removed — term sheet appears instantly on submit

---

## [1.1.0] — 2026-03-01 — Real On-Chain SPL-Governance

### Added
- **TX1** — `createTickMint`: mints a fresh $TICK SPL token to the deploying wallet on every DAO creation
- **TX2** — `createRealmWithDeposit`: real `withCreateRealm` + `withDepositGoverningTokens` → creates Realm PDA and TokenOwnerRecord PDA on devnet
- **TX3** — `createGovernanceAndProposal`: real `withCreateGovernance` + `withCreateProposal` + `withSignOffProposal` → governance + proposals live on devnet
- Explorer links for all 3 transaction signatures and account addresses shown in success screen
- `governanceActions.ts` — full helper module: `createTickMint`, `createRealmWithDeposit`, `createGovernanceAndProposal`, `lockTokens`, `castVoteOnProposal`

### Fixed
- **SES lockdown** (Phantom wallet): `lockdown-install.js` corrupts `bs58` `BASE_MAP` at runtime, breaking all `new PublicKey(string)` calls. Fix: use pre-computed `Uint8Array` bytes for `GOVERNANCE_PROGRAM_ID` instead of base58 string decode. Module-level constructions (e.g. `TOKEN_PROGRAM_ID`) are unaffected — they run before SES.
- **Governance PDA collision**: when `withCreateGovernance` receives `undefined` as governed account, the SDK generates a random keypair per call — collides on repeat deploys of the same realm. Fix: pass `SystemProgram.programId` explicitly for a deterministic governance PDA per realm.
- **Realm PDA collision**: deploying the same venue name twice creates the same realm PDA (already in use). Fix: append the first 6 chars of the mint address to the realm name on-chain; display name in UI remains clean.
- Browser webpack polyfills: `Buffer`, `process`, `stream` polyfills added to `ProvidePlugin`; `resolve.fallback` set for all Node built-ins required by Solana packages

### Changed
- `bn.js` replaces `@coral-xyz/anchor`'s `BN` export — anchor's BN crashes the browser bundle

---

## [1.0.1] — 2026-02-27 — Optimization Pass

### Fixed
- Division-by-zero bug in `ProposalCard.tsx` — `yesPct` now guarded with `total > 0` check
- Non-null assertion crash in `lock/page.tsx` — `.find()` result now falls back to last option via `??`
- Missing `min='0'` attribute on finance revenue input (allowed negative values)

### Added
- `Footer.tsx` — shared footer component extracted from 5 pages (DRY fix)
- `not-found.tsx` + `NotFoundClient.tsx` — custom 404 page (server+client split for metadata + interactivity)
- Per-page sublayouts: `create/layout.tsx`, `proposals/layout.tsx`, `lock/layout.tsx`, `finance/layout.tsx`
- OG/Twitter Card metadata in root `layout.tsx` (social share previews)
- `public/robots.txt` — allow all crawlers, sitemap reference
- `aria-hidden="true"` on decorative Navbar window-chrome dots (accessibility)

### Changed
- Removed unused `React` default import from `WalletProvider.tsx` (JSX transform handles it)
- `proposals/page.tsx` refactored to use `<ProposalCard />` component

---

## [1.0.0] — 2026-02-27 — Graveyard Hackathon MVP

### Added — Pages
- `/` Home — graveyard narrative table, hero CTA, terminal boot aesthetic, CRT scanlines
- `/lock` ve$TICK locking — four duration cards (30d 1× · 90d 2× · 180d 3× · 365d 4×), amount input, live voting power calc, 2s loading state, success screen
- `/create` Create DAO — venue name + quorum form, streaming deploy log, wallet pubkey as token mint, success screen
- `/proposals` Proposals — three governance proposals (resale cap · royalty · refund window), block-character `█░` progress bars, one-vote-per-wallet locking, ACTIVE/PASSED badges
- `/finance` RWA Finance — expected revenue + advance % inputs, live loan/repayment/yield calculator (3.5% origination), Request Advance → mock term sheet

### Added — Components
- `WalletProvider.tsx` — Solana Wallet Standard auto-discovery, `autoConnect=true`, silent `onError` (swallows WalletNotReadyError, user rejection, already-pending)
- `WalletWrapper.tsx` — SSR-safe client component wrapper (`dynamic(() => import, { ssr: false })`)
- `ProposalCard.tsx` — extracted reusable proposal card (BlockBar + VoteBtn internals, full props interface)
- `Footer.tsx` — shared footer component with optional `showVoteNote` prop (used across all 5 pages)
- `Navbar.tsx` — sticky terminal nav, macOS window chrome dots, active-route underline, WalletMultiButton

### Added — Infrastructure
- Next.js 16.1.6 with `--webpack` flag in both `dev` and `build` scripts (Turbopack conflict)
- Webpack `resolve.fallback` for `fs`, `os`, `path`, `crypto` (Solana browser polyfills)
- `governance.ts` — env-var constants, SPL-Governance program ID, network config
- `tailwind.config.ts` — Tailwind CSS 4.x content paths
- TypeScript strict mode throughout

### Added — Docs
- `ARCHITECTURE.md` — system overview, component map, SPL-Governance account types, ve$TICK model, security design, known limitations table
- `DEPLOYMENT.md` — local dev, Vercel step-by-step, custom RPC, post-deploy checklist, troubleshooting
- `ROADMAP.md` — 4-phase plan with goals, code targets, known risks
- `CONTRIBUTING.md` — branch strategy, conventional commits, PR process, code standards
- `SECURITY.md` — threat model, flash loan protection, responsible disclosure
- `TERMS.md` — terms of use, prototype disclaimer, MIT license notice, governing law
- `PRIVACY.md` — no data collected, wallet key handling, Vercel hosting disclosure
- `HACKATHON.md` — judges brief, prize track alignment, submission checklist
- `CHANGELOG.md` — this file
- `SECURITY_REVIEW.md` — security audit report (zero findings, 2026-02-27)

### Deployed
- Vercel: https://tix-dao.vercel.app
- GitHub: https://github.com/orthonode/TIX-DAO

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
