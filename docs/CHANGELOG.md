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

- Real `createRealm` CPI via `@solana/spl-governance` (Phase 2)
- Real `castVote` CPI — on-chain VoteRecordV2 PDAs (Phase 2)
- ve$TICK escrow contract — Anchor program with lock/unlock (Phase 2)
- $TICK SPL token mint (Phase 2)
- TICKS protocol RWA integration — real advance disbursement (Phase 3)
- Council multi-sig deployment (Phase 2)
- Mainnet launch (Phase 4)

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

### Deployed
- Vercel: https://tix-dao.vercel.app
- GitHub: https://github.com/orthonode/TIX-DAO

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
