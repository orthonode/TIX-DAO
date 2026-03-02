# TIX-DAO — Security Audit Report

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

---

## Report Metadata

| Field | Value |
|---|---|
| **Project** | TIX-DAO |
| **Version** | 2.0.0 |
| **Initial Audit Date** | 2026-02-27 (commit `3e73997`) |
| **Post-Audit Review** | 2026-03-01 (commit `a5ef31a` — real voting + simulation removal) |
| **Phase 2 Review** | 2026-03-02 (Phase 2 — escrow program, faucet, live deserialization) |
| **Auditor** | Internal — Orthonode Infrastructure Labs |
| **Audit Type** | Security Code Review (full codebase) |
| **Commit Reviewed** | HEAD (`main`) |
| **Scope** | All source files under `src/`, `public/`, `next.config.ts`, `.env*`, `tick-escrow/` |
| **Methodology** | Static analysis — manual code review + automated pattern scanning |
| **Result** | ✅ **No exploitable vulnerabilities found** |

---

## 1. Scope

This audit covers the entire TIX-DAO codebase at commit `3e73997`. All source files were reviewed:

### Files Audited

| Path | Type | Notes |
|---|---|---|
| `src/app/layout.tsx` | Server Component | Root layout, metadata, wallet wrapper |
| `src/app/page.tsx` | Client Component | Home / graveyard page |
| `src/app/not-found.tsx` | Server Component | Custom 404 metadata |
| `src/app/NotFoundClient.tsx` | Client Component | Interactive 404 page |
| `src/app/create/page.tsx` | Client Component | Create DAO form |
| `src/app/create/layout.tsx` | Server Component | Per-page metadata |
| `src/app/proposals/page.tsx` | Client Component | Governance proposals + voting |
| `src/app/proposals/layout.tsx` | Server Component | Per-page metadata |
| `src/app/lock/page.tsx` | Client Component | ve$TICK token locking |
| `src/app/lock/layout.tsx` | Server Component | Per-page metadata |
| `src/app/finance/page.tsx` | Client Component | RWA advance calculator |
| `src/app/finance/layout.tsx` | Server Component | Per-page metadata |
| `src/app/globals.css` | Stylesheet | Terminal theme, CRT scanlines |
| `src/components/WalletProvider.tsx` | Client Component | Solana wallet context |
| `src/components/WalletWrapper.tsx` | Client Component | SSR-safe dynamic import |
| `src/components/Navbar.tsx` | Client Component | Navigation bar |
| `src/components/ProposalCard.tsx` | Client Component | Proposal card UI |
| `src/components/Footer.tsx` | Client Component | Shared footer |
| `src/lib/governance.ts` | Library | Program ID + network constants |
| `src/lib/governanceActions.ts` | Library | **Added post-initial-audit (2026-03-01)** — on-chain helpers: createTickMint, createRealmWithDeposit, createGovernanceAndProposal, lockTokens, castVoteOnProposal; **Phase 2 (2026-03-02)**: lockTokensEscrow, unlockTokensEscrow, getEscrowState |
| `src/lib/governance.ts` | Library | **Phase 2**: added TICK_ESCROW_PROGRAM_ID, TICK_ESCROW_PROGRAM_ID_BYTES constants |
| `src/app/faucet/page.tsx` | Client Component | **Phase 2**: SOL faucet — requestAirdrop, rate-limit handling |
| `tick-escrow/programs/tick-escrow/src/lib.rs` | Anchor Program | **Phase 2**: ve$TICK time-lock escrow — lock_tokens, unlock_tokens; see third-party audit note §5.4 |
| `next.config.ts` | Config | Webpack fallbacks |
| `public/robots.txt` | Static | Crawler directives |
| `.env.local` | Environment | Runtime config |
| `package.json` | Manifest | Dependencies |

### Out of Scope

- Third-party dependency internals (`node_modules/`)
- On-chain Solana programs (SPL-Governance is externally audited by Solana Labs)
- Vercel infrastructure
- GitHub Actions / CI pipelines (none present)

---

## 2. Threat Model

TIX-DAO is a **frontend-only** Next.js application. There is no backend server, no database, no API routes, and no server-side user data processing. This significantly constrains the exploitable attack surface.

### Trust Boundaries

```
┌─────────────────────────────────────────────┐
│             USER BROWSER (untrusted)         │
│                                             │
│  TIX-DAO Next.js app (static export)        │
│  ├── User inputs → React state only         │
│  ├── Wallet interactions → browser extension│
│  └── RPC calls → Solana devnet (read+write) │
│                   TX1/TX2/TX3/vote/lock     │
└──────────────────────┬──────────────────────┘
                       │ JSON-RPC (read-only)
                       ▼
          ┌────────────────────────┐
          │  Solana Devnet RPC     │  ← Externally audited
          │  SPL-Governance        │  ← Solana Labs audited
          └────────────────────────┘
```

### Threat Actors Considered

| Actor | Capability | Relevant to MVP? |
|---|---|---|
| Passive network attacker | Intercept HTTP traffic | No — TLS enforced by Vercel |
| Active web attacker | Inject malicious content | No — no user-generated content served |
| Malicious website visitor | Exploit client-side vulnerabilities | Reviewed — no paths found |
| Compromised dependency | Supply chain attack | Not in scope (managed separately) |
| Flash loan attacker | Governance capture | Handled by SPL-Governance lock design |

---

## 3. Vulnerability Categories Assessed

### 3.1 Injection Vulnerabilities

| Sub-category | Applicable | Findings |
|---|---|---|
| SQL Injection | ❌ No database | N/A |
| Command Injection | ❌ No system calls | N/A |
| Path Traversal | ❌ No file I/O | N/A |
| Template Injection | ❌ No server-side templating | N/A |
| XXE Injection | ❌ No XML parsing | N/A |
| NoSQL Injection | ❌ No database | N/A |

**Result: Not applicable. No injection attack surface exists.**

---

### 3.2 Cross-Site Scripting (XSS)

All user-facing content is rendered via React JSX. React automatically escapes string values interpolated into JSX — they are rendered as DOM text nodes, not raw HTML.

**Specific checks performed:**

| Check | Location | Result |
|---|---|---|
| `dangerouslySetInnerHTML` usage | All `.tsx` files | ✅ Not found |
| `innerHTML` assignment | All `.tsx` files | ✅ Not found |
| `document.write()` | All `.tsx` files | ✅ Not found |
| Unescaped user input in HTML | All pages | ✅ All inputs rendered as React text nodes |
| Dynamic `href` from user input | All Link components | ✅ No user-controlled `href` |
| `eval()` or `new Function()` | All files | ✅ Not found |

**User inputs by page:**

| Page | Input Fields | Render Method | XSS Risk |
|---|---|---|---|
| `/create` | Venue name, quorum %, token mint | React state → JSX text | None |
| `/proposals` | Vote action (button click) | React state update | None |
| `/lock` | Amount (number input) | `parseFloat()` → number | None |
| `/finance` | Revenue, advance % (number inputs) | `parseFloat()` → number | None |

**Result: No XSS vulnerabilities. React's automatic escaping is correctly relied upon throughout.**

---

### 3.3 Authentication and Authorization

This is a client-side application. Wallet connection is handled entirely by the Solana Wallet Standard browser extension. No custom authentication logic is implemented.

| Check | Finding |
|---|---|
| Custom auth logic | None — delegated to wallet adapter |
| Session tokens | None — no server sessions |
| JWT handling | None |
| Admin/privileged endpoints | None — no server endpoints |
| Client-side permission checks | Present as UX guards only (not security boundaries) — correct for frontend |

**Note on client-side guards:** Pages like `/proposals` check `connected` (wallet status) before enabling voting buttons. This is a UX affordance only — client-side guards are never security boundaries. This is architecturally correct: the actual authorization would occur at the on-chain instruction level (Phase 2). No finding raised.

**Result: No authentication or authorization vulnerabilities.**

---

### 3.4 Secrets and Cryptographic Material

| Check | Finding |
|---|---|
| Private keys in source | ✅ None found |
| API keys in source | ✅ None found |
| Hardcoded passwords | ✅ None found |
| `.env.local` contents | `NEXT_PUBLIC_SOLANA_NETWORK=devnet` and `NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID=GovER5...` — both intentionally public, prefixed `NEXT_PUBLIC_` per Next.js convention |
| `.gitignore` coverage | `.env*` correctly ignored — `.env.local` not committed |
| Custom cryptography | None — all crypto delegated to `@solana/web3.js` and wallet extension |
| Weak RNG | None — no random number generation in application code |

**Result: No secrets management issues. Environment variable handling is correct.**

---

### 3.5 Data Exposure and Logging

| Check | Location | Finding |
|---|---|---|
| `console.log` with user data | All files | None |
| `console.warn` | `WalletProvider.tsx:40` | Logs `error.name` and `error.message` — wallet error metadata only, no PII or secrets |
| `console.error` | All files | None found |
| Local storage of sensitive data | All files | None — no `localStorage` or `sessionStorage` usage |
| Network requests with user PII | All files | None — no fetch/axios calls to external APIs |

**The `console.warn` at `WalletProvider.tsx:40`:**
```typescript
console.warn('[tix-dao wallet]', error.name, error.message);
```
This only fires for unexpected wallet errors (not user rejections or missing wallets) and logs the error class name and message string from the Solana wallet adapter. No PII, no secrets. Not a finding.

**Result: No sensitive data exposure.**

---

### 3.6 Dependency and Supply Chain

| Check | Finding |
|---|---|
| Suspicious packages | None identified |
| Known malicious packages | None — all packages are standard Solana/Next.js ecosystem |
| Overly broad package permissions | N/A — browser runtime |
| Lock file present | `package-lock.json` present |

**Key dependencies and their trust status:**

| Package | Publisher | Audit Status |
|---|---|---|
| `next` | Vercel | Actively maintained, audited |
| `react` / `react-dom` | Meta | Actively maintained |
| `@solana/web3.js` | Solana Labs | Actively maintained |
| `@solana/wallet-adapter-*` | Solana Labs / Anza | Actively maintained |
| `@solana/spl-governance` | Solana Labs | Actively maintained |
| `@coral-xyz/anchor` | Coral / Armada | Actively maintained |

**Note:** Dependency CVE scanning is out of scope for this review and is managed separately via `npm audit`.

**Result: No supply chain concerns identified within scope.**

---

### 3.7 Configuration and Infrastructure

| Check | Finding |
|---|---|
| `next.config.ts` webpack fallbacks | `fs: false, os: false, path: false, crypto: false` — correct; prevents Node.js built-ins leaking into browser bundle |
| CSP headers | Not explicitly configured; relies on Vercel defaults |
| HTTPS enforcement | Enforced by Vercel (HSTS) |
| `robots.txt` | `Allow: /` — intentional, correct for a public app |
| Source maps in production | Not explicitly disabled; low risk for a public open-source project |

**Result: Configuration is appropriate for a frontend-only deployment.**

---

## 4. Findings Summary

| # | Severity | Category | File | Status |
|---|---|---|---|---|
| — | — | — | — | No findings |

**Total vulnerabilities found: 0**

No issues met the threshold of >80% confidence of actual exploitability.

---

## 5. Informational Notes

These items are **not** vulnerabilities but are noted for completeness.

### 5.1 Real On-Chain Transactions — Post-Audit Additions (2026-03-01)

After the initial audit at commit `3e73997`, the file `src/lib/governanceActions.ts` was added and subsequently updated to wire all on-chain functionality. The full set of real CPI calls now in production:

- **TX1** — `createTickMint`: mints a fresh $TICK SPL token via `SystemProgram.createAccount` + `createInitializeMint2Instruction`
- **TX2** — `createRealmWithDeposit`: calls `withCreateRealm` + `withDepositGoverningTokens` (creates Realm PDA + TokenOwnerRecord PDA)
- **TX3** — `createGovernanceAndProposal`: calls `withCreateGovernance` + 3× `withCreateProposal` + 3× `withSignOffProposal` (3 standard TIX-DAO proposals created and signed off in one transaction)
- **castVoteOnProposal**: calls `withCastVote` — wired to all 3 proposals on `/proposals` page; creates `VoteRecordV2` PDA per vote on devnet
- **lockTokens**: calls `withDepositGoverningTokens` — wired to `/lock` page; deposits tokens into SPL-Governance on devnet

All calls are confirmed on Solana devnet (no real funds involved). These files were not in scope of the initial audit.

**Informational findings from post-audit review:**

| # | Issue | Fix Applied |
|---|---|---|
| 1 | `new PublicKey(GOVERNANCE_PROGRAM_ID)` would break after Phantom's SES lockdown corrupts `bs58` | Fixed: using pre-computed `Uint8Array` bytes for program ID |
| 2 | Passing `undefined` to `withCreateGovernance` caused SDK to generate a random keypair per call, creating non-deterministic governance PDAs | Fixed: passing `SystemProgram.programId` explicitly |
| 3 | Same venue name produces the same realm PDA — re-deploying same name causes `AccountAlreadyInUse` | Fixed: appending first 6 chars of mint address to realm name for uniqueness |
| 4 | `/proposals` page had hardcoded `MOCK_PROPOSALS` — votes only updated React state, `castVoteOnProposal` not called | Fixed: full rewrite using URL params; real `castVote` CPI called for each of 3 proposals |
| 5 | `/finance` page used `setTimeout(1800)` to simulate async processing | Fixed: removed; `handleRequest` is synchronous (pure calculator — no on-chain call needed) |

**Recommendation:** A dedicated third-party audit of `governanceActions.ts` is recommended before Phase 4 mainnet deployment, particularly covering the instruction construction and PDA derivation logic.

### 5.2 Public RPC Endpoint
`WalletProvider.tsx` connects to `clusterApiUrl('devnet')` — the public Solana devnet RPC. This endpoint is rate-limited and unauthenticated. For production (mainnet), a private RPC endpoint (Helius, QuickNode) should be used. Not a security issue for a devnet demo.

### 5.3 No Content Security Policy
No CSP header is configured. For a frontend-only app with no user-generated content and no inline scripts, the default browser security model is adequate at this stage. A strict CSP should be added in Phase 2 alongside real on-chain calls.

### 5.4 Third-Party Audit Recommendation
Before Phase 2 mainnet deployment, a professional third-party audit is recommended covering:
- The ve$TICK escrow Anchor program
- Any TICKS protocol integration code
- On-chain instruction construction in the frontend

---

## 6. Conclusion

The TIX-DAO codebase at commit `3e73997` presents **no exploitable security vulnerabilities**. The application correctly leverages React's automatic XSS protections, delegates cryptographic operations to audited Solana libraries, handles environment configuration correctly, and implements no custom authentication logic that could be bypassed.

The frontend-only architecture minimizes attack surface significantly. The primary security considerations for this project lie in the on-chain program layer (SPL-Governance, future ve$TICK escrow), which is either externally audited (SPL-Governance) or not yet built (Phase 2+).

**Security posture: SECURE for MVP / Hackathon submission.** The post-audit addition of `governanceActions.ts` introduced and immediately fixed three informational issues (see §5.1). A separate third-party audit of the on-chain transaction construction code is recommended before mainnet deployment.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
