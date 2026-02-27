# Changelog

All notable changes to TIX-DAO are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-02-27 — Graveyard Hackathon MVP

### Added
- `/` Home page — graveyard narrative table + hero CTA with terminal boot aesthetic
- `/lock` ve$TICK lock page — duration cards (30/90/180/365 days), live voting power calculator, success state
- `/create` Create DAO page — venue name + quorum form, streaming deploy log, success screen
- `/proposals` Proposals page — three governance proposals, block-character progress bars, one-vote-per-wallet locking
- `/finance` RWA Finance page — revenue/advance inputs, live loan/repayment/yield calc, mock term sheet
- `WalletProvider.tsx` — Wallet Standard auto-discovery, `autoConnect`, silent `onError` handler
- `WalletWrapper.tsx` — SSR-safe dynamic import wrapper (`ssr: false`)
- `ProposalCard.tsx` — reusable proposal card component (BlockBar + VoteBtn internals)
- `Navbar.tsx` — sticky terminal nav with macOS window chrome, active-route detection
- `governance.ts` — env-var constants for SPL-Governance program ID and network
- Webpack polyfills for Solana Node.js built-ins (`fs`, `os`, `path`, `crypto`)
- Vercel deployment at https://tix-dao.vercel.app
- GitHub repository at https://github.com/orthonode/TIX-DAO
- Full docs suite: ARCHITECTURE · DEPLOYMENT · ROADMAP · CONTRIBUTING · SECURITY · TERMS · PRIVACY · HACKATHON · CHANGELOG

### Technical
- Next.js 16.1.6 App Router with `--webpack` flag (Turbopack conflict with Solana packages)
- React 19.2.3, TypeScript strict mode
- SPL-Governance `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw` on Solana devnet
- `@solana/spl-governance ^0.3.28` installed, Phase 2 wires real CPI calls

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
