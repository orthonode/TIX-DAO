# Changelog

All notable changes to TIX-DAO are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — 2026-03-01 — Real On-Chain Voting, All Simulations Removed

### Added
- Real `castVote` CPI for all 3 proposals — `VoteRecordV2` PDAs created on Solana devnet
- `NoDAO` fallback on `/proposals` when no URL params present
- `STANDARD_PROPOSALS` shared constant — same titles used in TX3 and proposals UI
- TX3 now creates all 3 proposals + signs off all 3 in one transaction
- Per-proposal Explorer tx links on proposals page

### Changed
- `proposals/page.tsx` complete rewrite — no `MOCK_PROPOSALS`, real voting wired for all 3 proposals
- `finance/page.tsx` — removed `setTimeout` simulation; synchronous term sheet display
- Shareable URL uses `p1`, `p2`, `p3` params for all 3 proposal PDAs
- Create DAO success screen shows all 3 proposal accounts

---

## [1.1.0] — 2026-03-01 — Real On-Chain SPL-Governance

### Added
- Real 3-TX on-chain deploy: TX1 mint $TICK · TX2 createRealm + deposit · TX3 createGovernance + 3 proposals + signOff — all confirmed on Solana devnet
- `src/lib/governanceActions.ts` — full on-chain helper module
- Explorer links for all 3 tx signatures + account addresses on Create DAO success screen
- Shareable URL with realm, governance, and all 3 proposal PDAs generated post-deploy

### Fixed
- SES lockdown (Phantom): `bs58` corruption fixed by using pre-computed `Uint8Array` bytes for `GOVERNANCE_PROGRAM_ID`
- Governance PDA collision: `withCreateGovernance` now receives `SystemProgram.programId` instead of `undefined` (SDK was generating a random keypair per call)
- Realm PDA collision: mint address suffix appended to realm name for uniqueness on repeat deploys
- Browser webpack polyfills: `Buffer`, `process`, `stream` added to ProvidePlugin

### Changed
- `bn.js` replaces `@coral-xyz/anchor` BN export (anchor's BN crashes browser bundle)

---

## [1.0.1] — 2026-02-27 — Optimization Pass

### Fixed
- Division-by-zero bug in `ProposalCard.tsx`
- Non-null assertion crash in `lock/page.tsx`
- Missing `min='0'` on finance revenue input

### Added
- `Footer.tsx` shared component
- `not-found.tsx` + `NotFoundClient.tsx` custom 404 page
- Per-page sublayouts for `create/`, `proposals/`, `lock/`, `finance/`
- OG/Twitter Card metadata in root `layout.tsx`
- `public/robots.txt`

---

## [1.0.0] — 2026-02-27 — Graveyard Hackathon MVP

### Added
- All 5 pages: `/` · `/lock` · `/create` · `/proposals` · `/finance`
- Wallet Standard auto-discovery — Phantom, Solflare, Backpack
- SSR-safe wallet provider pattern (`WalletWrapper` → `ssr: false`)
- Webpack fallbacks for Solana Node.js built-ins
- Vercel deployment at https://tix-dao.vercel.app
- Full docs suite: ARCHITECTURE · CHANGELOG · DEPLOYMENT · ROADMAP · CONTRIBUTING · SECURITY · TERMS · PRIVACY · HACKATHON · AUDIT

---

Full changelog with implementation details: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)

*TIX-DAO · by [Orthonode Infrastructure Labs](https://orthonode.xyz)*
