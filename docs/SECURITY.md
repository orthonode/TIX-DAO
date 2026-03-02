# TIX-DAO — Security

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

## 1. Threat Model

TIX-DAO is a governance interface sitting on top of SPL-Governance. The relevant threat surface covers two layers:

**On-chain (governance layer)**
- Flash loan attacks — borrow governance supermajority within a single block, pass malicious proposal, drain treasury
- Governance capture — accumulate tokens over time, pass proposals that redirect treasury or change royalty rates to zero
- Proposal spam — flood the governance program with low-quality proposals to confuse or exhaust voters
- Double voting — cast multiple votes for the same proposal from the same token account
- Snapshot manipulation — sell tokens after voting to make vote weight "free"

**Frontend (browser layer)**
- Private key exposure — UI must never request or handle private keys
- Malicious transaction injection — a compromised frontend could craft transactions that do more than they appear to
- XSS leading to wallet drain — cross-site scripting could inject malicious wallet call triggers
- CORS / RPC poisoning — a fake RPC endpoint returning manipulated account data
- Dependency compromise — a malicious npm package in the supply chain

---

## 2. Flash Loan Attack Protection

The **$182M Beanstalk Farms exploit (April 2022)** is the canonical example of flash loan governance attack. The attacker:
1. Took a flash loan on Ethereum large enough for a governance supermajority
2. Deposited tokens, immediately voted on a pre-staged malicious proposal
3. Executed the proposal (which drained the treasury to their address)
4. Repaid the flash loan
5. All within a single Ethereum transaction — start to finish in seconds

TIX-DAO's governance configuration is designed specifically to make this attack path impossible:

### Minimum Lock Period — 30 Days
```
governance_config.min_community_weight_to_create_governance = 1,000,000 $TICK
TokenOwnerRecord.governing_token_deposit_amount must be locked for ≥ 30 days
```
A flash loan lasts for one block (< 1 second). It cannot satisfy a 30-day lock. Any tokens used for a flash loan will not have a valid TokenOwnerRecord with the required lock status and therefore carry zero vote weight.

### 7-Day Voting Cooloff
```
governance_config.voting_cool_off_time = 604,800 seconds (7 days)
```
After a proposal reaches quorum, there is a mandatory 7-day window before any `executeTransaction` instruction can be processed. This gives the council and the community time to identify and veto malicious proposals even if an attacker somehow accumulated legitimate token weight.

### Council Veto
A council governance account holds veto authority over community proposals. The council is a multi-sig — it requires M-of-N signatures from trusted venue operators to veto. This is the last line of defense if community governance is captured.

**Combined effect:** An attacker must hold locked $TICK for at least 30 days, achieve quorum in a live vote, wait 7 days, and defeat a council veto. The economic cost of holding $TICK for 30+ days far exceeds any plausible treasury value at the hackathon stage.

---

## 3. Governance Capture

A sophisticated attacker with patient capital could accumulate $TICK over 30+ days to achieve a governance supermajority. Mitigations:

**Snapshot voting**
Vote weight is recorded at the moment `castVote` is submitted on-chain via the `VoteRecordV2` PDA. Selling tokens after voting does not reduce already-cast vote weight, but it also does not allow the attacker to re-vote. The locked escrow model means large holders cannot quickly liquidate after a vote.

**ve$TICK time weighting**
Under the locking model, a whale who holds $TICK liquid (no lock) gets 0× multiplier. To achieve the maximum 4× multiplier they must lock for 365 days — committing capital for a year. Short-term capture attempts face a structural disadvantage against long-term committed community members.

**Maximum wallet governance cap (Phase 2)**
In Phase 2, we will implement a per-wallet cap on governance weight (e.g., no single wallet may cast more than 10% of quorum). This prevents a single large holder from achieving unilateral control regardless of token balance.

**Council circuit breaker**
As above — the council can veto any proposal within the 7-day cooloff, providing a human check against automated capture attempts.

---

## 4. Smart Contract Security

TIX-DAO's governance logic is entirely implemented by the SPL-Governance program at `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`.

**We did not write any custom governance programs.** This is a deliberate security decision. SPL-Governance:
- Was developed by Solana Labs
- Has been audited multiple times
- Has been running in production on mainnet since 2021
- Is the program backing hundreds of Solana DAOs including major protocols
- Has its own bug bounty program via Immunefi

TIX-DAO acts as a client to SPL-Governance, not as a program itself. The attack surface of our codebase is therefore limited to the frontend.

**The ve$TICK escrow contract (Phase 2)** will be custom Anchor code. It will require a third-party security audit from a recognized Solana security firm (e.g., Neodyme, OtterSec, Sec3) before handling any real funds on mainnet.

---

## 5. Frontend Security

### No Private Keys in the Browser
The frontend never requests, stores, or handles private keys. All transaction signing happens entirely within the user's browser wallet (Phantom, Solflare, Backpack). The wallet extension:
- Displays the transaction details to the user before signing
- Signs the transaction locally, in the extension's sandboxed context
- Only sends the signed transaction (not the private key) back to the page

The wallet adapter library (`@solana/wallet-adapter-react`) is the standard interface for this pattern and is used by virtually every Solana dApp.

### Wallet Adapter Error Handling
All wallet errors are caught by the `onError` callback in `src/components/WalletProvider.tsx`. Expected errors (user rejection, no wallet found, already-pending request) are silently swallowed. Only unexpected errors reach `console.warn`. This prevents wallet-related crashes from exposing stack traces or internal state to users.

### No Server-Side Signing
TIX-DAO has no backend server. All pages are statically rendered by Next.js and served via Vercel's CDN. There is no server-side signing, no backend wallet, and no API route that handles transactions. This eliminates server-side key compromise as a threat vector entirely.

### Content Security
- No `eval()` or dynamic code execution anywhere in the frontend
- All external links use `rel="noopener noreferrer"`
- Next.js provides built-in XSS protection via JSX's automatic escaping

### Dependency Supply Chain
The full dependency tree is locked in `package-lock.json`. All production dependencies are well-maintained packages from established publishers (Solana Labs, Anza, Next.js/Vercel). We do not use any unverified or personal npm packages.

---

## 6. Known Limitations (as of 2026-03-01)

We believe in honest security disclosure. The following limitations exist in the current build:

| Item | Status | Implication |
|---|---|---|
| DAO creation (TX1/TX2/TX3) | ✅ Real on-chain | TX1 mint $TICK · TX2 createRealm+deposit · TX3 createGovernance+3 proposals+signOff — all confirmed on Solana devnet |
| On-chain transaction construction | ✅ Reviewed | `governanceActions.ts` uses bytes-based program ID (SES-safe); deterministic governance PDA via `SystemProgram.programId` |
| Voting (castVote CPI) | ✅ Real on-chain | `castVoteOnProposal` wired to proposals UI for all 3 proposals; each vote creates a `VoteRecordV2` PDA on devnet |
| Token locking | ✅ Real on-chain | `lockTokens` calls `depositGoverningTokens` CPI; tokens deposited into SPL-Governance on devnet |
| RWA finance calculator | ⚠️ Phase 3 | UI-only calculator; TICKS protocol disbursement ships Phase 3 |
| ve$TICK escrow | ⚠️ Phase 2 | Lock duration UI is live; custom escrow contract with time-weighted multipliers ships Phase 2 |
| Live proposal deserialization | ⚠️ Phase 2 | Proposals loaded from URL params; full `getGovernanceAccounts` subscription ships Phase 2 |
| No audit of `governanceActions.ts` | Phase 2 scope | Added post-initial-audit; see informational note 5.1 in SECURITY_REVIEW.md |
| Public devnet RPC | Rate-limited | Not suitable for high-traffic production |
| Council multi-sig | ⚠️ Phase 2 | Emergency veto mechanism exists in design only |

The on-chain transaction construction (`governanceActions.ts`) will be included in the next audit cycle before Phase 2 mainnet deployment.

---

## 7. Responsible Disclosure

If you discover a security vulnerability in TIX-DAO:

**Do not** open a public GitHub issue. Public disclosure before a fix is available puts users at risk.

**Do** report it privately:

1. **Email:** security@tix-dao.xyz *(placeholder — replace with real address before mainnet)*
2. **Subject line:** `[SECURITY] Brief description of vulnerability`
3. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact (what an attacker could do)
   - Your suggested fix (optional but appreciated)

**Response commitment:**
- We will acknowledge receipt within 48 hours
- We will provide a status update within 7 days
- We will credit you in the release notes unless you prefer to remain anonymous

**Scope:**
- In scope: the TIX-DAO frontend, the ve$TICK escrow contract (once deployed), any TIX-DAO-specific configuration of SPL-Governance
- Out of scope: the SPL-Governance program itself (report those via [Immunefi's Solana Labs program](https://immunefi.com/bug-bounty/solanafoundation/)), Phantom/Solflare wallets, Solana core protocol

**Note on current build:**
TIX-DAO runs real SPL-Governance transactions on Solana devnet: TX1 mint, TX2 createRealm+deposit, TX3 createGovernance+3 proposals+signOff, castVote (all 3 proposals), and depositGoverningTokens (lock page). Devnet assets have no real-world value. Responsible disclosure is appreciated; it becomes strictly binding when Phase 2 ships the ve$TICK escrow contract and when Phase 4 deploys to mainnet.

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
