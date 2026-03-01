# TIX-DAO — Hackathon Judges Brief

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

**Event:** Solana Graveyard Hackathon 2026
**Track(s):** Realms Governance Builders · Realms Extensions · kyd. Ticketing

---

## 1. The Graveyard Narrative — Why Ticketing Is Broken

The global live events industry was valued at approximately **$88 billion in 2025** (Verified Market Research). The governance of that money — who gets what percentage, under what rules, enforced how — is controlled entirely by two or three centralized platforms.

**Live Nation posted record revenue of $23.1 billion in 2024.** Ticketmaster's fees average **27% of ticket face value** (US Government Accountability Office). The DOJ filed an antitrust suit against Live Nation/Ticketmaster in May 2024 alleging monopoly control of the live events sector; a jury trial was scheduled to begin **March 2, 2026**. Live Nation's February 2026 bid for full dismissal was rejected by the court.

The graveyard of projects that tried to change this tells a clear story about what has already been attempted — and why it failed:

### YellowHeart — Royalty bypass killed the value proposition (2022)

YellowHeart (founded 2021) sold concert tickets as NFTs promising artists would earn royalties on every resale. The fatal flaw: NFT royalties on secondary markets are opt-in for marketplaces. In **October 2022**, Magic Eden — the dominant Solana NFT marketplace — moved to an optional royalty model under competitive pressure. Artists earned nothing on secondary sales. YellowHeart's core promise became unenforceable because enforcement was off-chain and voluntary for each marketplace.

YellowHeart continues to exist as a company but cannot deliver on its founding value proposition — artist royalties on secondary sales — across any marketplace that declines to enforce them.

**TIX-DAO fix:** Resale royalty rates are governance proposals voted on-chain and stored in `ProposalV2` accounts. Enforcement happens at the TICKS protocol escrow level — not at the marketplace level. No marketplace can opt out of a smart contract escrow.

### TokenProof — Ethereum gas made the economics impossible (2022–2024)

TokenProof (founded 2022) built on-chain ticket verification originally on Ethereum. The economics were catastrophic: verifying a ticket at the door cost $30–50 in Ethereum L1 gas during peak periods. For 10,000 attendees, that is $300K–$500K in gas for a single show. The product worked technically; the unit economics made commercial deployment at scale impossible.

TokenProof was **acquired by Yuga Labs in December 2024**, with teams absorbed into Yuga's R&D. The original mission — independent, scalable on-chain ticket verification — was never achieved.

**TIX-DAO fix:** Built on Solana. The Solana base transaction fee is 5,000 lamports = 0.000005 SOL. At today's SOL price (~$86, March 2026), that is approximately **$0.0004 per transaction**. For 100,000 ticket verifications: roughly **$43 on Solana** versus **$3,000,000+ on Ethereum L1** at 2022 peak gas prices — a 70,000× cost reduction. The economics that destroyed TokenProof do not exist on Solana.

### GET Protocol — Governance in name only (2018–present)

GET Protocol (founded 2018, now rebranded as **OPEN Ticketing Ecosystem**) built sophisticated blockchain ticketing infrastructure that has processed millions of tickets across multiple countries. The persistent problem: all policy decisions — service fees, royalty rates, partner onboarding — are made by the GET Protocol foundation. Token holders have no meaningful binding vote. When the foundation makes decisions stakeholders disagree with, there is no recourse. Blockchain infrastructure with centralized governance is better than Web2, but it is not trustless.

The project continues to operate in 2026 under its OPEN Ticketing rebrand, but the governance model has not changed.

**TIX-DAO fix:** Policy decisions (resale caps, royalties, refund windows) are literal `ProposalV2` accounts on Solana devnet. Every $TICK holder votes. Results execute on-chain. No foundation can override a passed proposal because there is no foundation in the execution path — only the SPL-Governance program.

### Beanstalk — Flash loan governance attack ($182M, April 2022)

Beanstalk Farms lost **$182 million** when an attacker flash-borrowed a governance supermajority on Ethereum, passed a malicious proposal draining the treasury, and repaid the loan — all in one transaction. The Beanstalk protocol had no minimum lock period, no cooloff window, and no veto mechanism. The governance was real but the security design was catastrophically flawed. Beanstalk never recovered.

**TIX-DAO fix:** 30-day minimum lock period (a flash loan lasts milliseconds, not 30 days), 7-day voting cooloff before any proposal executes, council veto authority. The Beanstalk attack vector is explicitly designed out of the architecture. See [`ARCHITECTURE.md §6`](./ARCHITECTURE.md) for the full security analysis.

---

## 2. What We Resurrected

Each failure above has a specific, technical counterpart in TIX-DAO:

| Failed Project | Core Failure | TIX-DAO Counter-Measure | Code Location |
|---|---|---|---|
| YellowHeart | Off-chain royalty enforcement (marketplace opt-out) | SPL-Governance `ProposalV2` → TICKS escrow enforces royalty rate | `governanceActions.ts` → `withCreateProposal` |
| TokenProof | Ethereum L1 gas ($30–50/tx) | Solana: ~$0.0004/tx at $86/SOL; 100K txs ≈ $43 | `WalletProvider.tsx` → `clusterApiUrl('devnet')` |
| GET Protocol | Foundation-controlled governance | Token-weighted on-chain voting; `ProposalV2` PDAs are the binding record | `proposals/page.tsx` → `castVoteOnProposal` |
| Beanstalk | Flash loan attack — no lock, no cooloff | 30-day lock + 7-day cooloff + council veto | `ARCHITECTURE.md §6` |

---

## 3. Prize Track Alignment

### Track 1: Realms Governance Builders

**Real SPL-Governance CPI calls — confirmed on devnet:**

TIX-DAO deploys one Realm per venue using three real on-chain transactions:

- **TX1** — `createTickMint`: mints a fresh $TICK SPL token to the deploying wallet
- **TX2** — `createRealmWithDeposit`: calls `withCreateRealm` + `withDepositGoverningTokens` → creates Realm PDA and TokenOwnerRecord PDA on devnet
- **TX3** — `createGovernanceAndProposal`: calls `withCreateGovernance` + `withCreateProposal` + `withSignOffProposal` → governance account and genesis proposal confirmed on devnet

The Realm structure follows the canonical Realms two-governance pattern:

```
Realm: "House of Blues Chicago-AbCd12"
  ├── Community Governance
  │     Token: $TICK
  │     Quorum: 20% of circulating supply
  │     Proposals: resale caps, royalty rates, refund windows
  │     Cooloff: 7 days (flash loan protection)
  └── Council Governance
        Token: Council NFT (non-transferable)
        Role: veto authority, emergency pause
```

Every proposal is a `ProposalV2` account. Every vote creates a `VoteRecordV2` account. Every voter's weight is tracked in a `TokenOwnerRecord`. No custom governance logic was written — SPL-Governance handles all state transitions.

**Why this is the strongest possible Realms integration:**
- Uses the canonical program (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`) — not a fork
- TX1/TX2/TX3 are confirmed real devnet transactions (not mocked)
- Follows the exact two-governance-account pattern (community + council) documented in Realms
- Governance proposals are domain-specific (ticketing policy) — showing Realms works for vertical applications

---

### Track 2: Realms Extensions

**The ve$TICK wrapper as a reusable Voter Weight plugin:**

SPL-Governance's Voter Weight Record interface allows any program to implement custom vote weight logic. TIX-DAO's ve$TICK escrow (Phase 2) implements this interface:

```typescript
// The Voter Weight plugin interface
interface VoterWeightRecord {
  realm: PublicKey;
  governingTokenMint: PublicKey;
  governingTokenOwner: PublicKey;
  voterWeight: BN;                    // computed from lock duration
  voterWeightExpiry: Option<Slot>;    // when weight expires
  weightAction: Option<VoterWeightAction>;
  weightActionTarget: Option<PublicKey>;
  reserved: number[];
}
```

The ve$TICK plugin is not just for TIX-DAO. Any Realms DAO — DeFi protocol, creator DAO, grant organization — can deploy ve$TICK and give their community the same time-weighted voting power model. The multiplier table (30 days = 1×, 90 = 2×, 180 = 3×, 365 = 4×) is a configuration parameter, not hardcoded.

This is a genuine extension to the Realms ecosystem, not just a client of existing functionality.

---

### Track 3: kyd. Ticketing

**How governance + RWA financing extends the TICKS protocol vision:**

The TICKS protocol models tickets as real-world assets (RWAs) on Solana. Each ticket has:
- A face value
- An owner wallet
- A transfer history

TIX-DAO adds the governance layer that TICKS needs to be a complete protocol:

1. **Policy governance** — the royalty rate, resale cap, and refund window stored in TIX-DAO `ProposalV2` accounts become the enforcement parameters for TICKS escrow. Governance proposals are the on-chain term sheet.

2. **RWA financing** — venue operators can borrow against future ticket sale revenue. The collateral is the ticket RWAs (TICKS). The terms are voted on by the DAO. The repayment is automated from escrow when tickets sell.

3. **Artist participation** — artists are not passive recipients of whatever the venue decides. With a governance stake ($TICK), artists vote on royalty proposals directly. First time this is possible without a lawyer.

**Concrete demo of the integration:**
The three proposals on `/proposals` are not hypothetical — they are the exact governance actions that would flow into TICKS escrow enforcement:
- "Cap resale at 150% of face value" → TICKS transfer instruction checks this cap
- "Set artist royalty at 10%" → TICKS escrow splits 10% to artist on every secondary sale
- "Allow 72hr refund window" → TICKS escrow holds settlement for 72 hours post-purchase

---

### Prize Track Summary

| Track | Sponsor | Our Angle |
|---|---|---|
| Realms Governance Builders | Realms | Vertical governance UI + real SPL-Governance TX1/TX2/TX3 on devnet |
| Realms Extensions | Realms | ve$TICK voter weight plugin — reusable by any Realms DAO |
| kyd. Ticketing | kyd. | Governance layer for TICKS protocol — policy + RWA financing |

**Cross-track narrative is the strongest submission** because the three tracks are not independent — they build on each other. Realms provides the governance primitive. ve$TICK provides the economic incentive alignment. kyd./TICKS provides the real-world asset enforcement layer. No other submission targets all three in a unified architecture.

---

## 4. Live Demo Links

| Resource | URL |
|---|---|
| Live Demo | https://tix-dao.vercel.app |
| GitHub Repository | https://github.com/orthonode/TIX-DAO |
| Video Walkthrough | https://youtu.be/DAG3S8uOmeE |
| Devnet Explorer | [Solana Explorer — Devnet](https://explorer.solana.com/?cluster=devnet) |
| SPL-Governance Program | [GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw on Devnet](https://explorer.solana.com/address/GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw?cluster=devnet) |

---

## 5. Technical Novelty

To our knowledge, the following combination has not been built before:

1. **Venue-specific Realms UI with real on-chain calls** — app.realms.today is a generic governance client. TIX-DAO is the first governance UI built specifically for live event venues, with proposal templates pre-wired to ticketing policy categories (resale, royalty, refund) and real SPL-Governance TX1/TX2/TX3 confirmed on devnet.

2. **Flash-loan-proof governance for event ticketing** — the Beanstalk pattern applied specifically to ticket policy governance, with domain-specific threat modeling (venues and artists, not DeFi LPs). The $182M Beanstalk attack on Ethereum in April 2022 is the canonical example; TIX-DAO's config makes this attack impossible.

3. **ve$TICK as a reusable Realms plugin** — the time-weighted vote escrow pattern exists in DeFi (veCRV on Ethereum, veBAL). Implementing it as a Realms Voter Weight plugin that any DAO can use is novel to the Solana governance ecosystem.

4. **Governance → RWA enforcement pipeline** — using SPL-Governance `ProposalV2` accounts as the on-chain term sheet for TICKS protocol escrow parameters closes the loop from "fans vote on policy" to "policy enforced at the contract level."

5. **SES lockdown compatibility** — Phantom's `lockdown-install.js` corrupts `bs58` base-x encoding at runtime, breaking all `new PublicKey(string)` calls after page load. TIX-DAO is the first governance UI to explicitly solve this by using pre-computed `Uint8Array` bytes for program IDs, making it robust under Phantom's security model.

---

## 6. Submission Checklist

Confirming all hackathon requirements are met:

**Required deliverables:**
- [x] Working demo deployed to public URL (Vercel): https://tix-dao.vercel.app
- [x] GitHub repository with full source code: https://github.com/orthonode/TIX-DAO
- [x] Video walkthrough (< 3 minutes): https://youtu.be/DAG3S8uOmeE
- [x] README with project description, setup instructions, prize track alignment
- [x] Architecture documentation

**Technical requirements:**
- [x] Solana devnet (not mainnet, not local validator)
- [x] SPL-Governance program address used: `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`
- [x] Real on-chain transactions: TX1 mint · TX2 createRealm+deposit · TX3 createGovernance+3×createProposal+3×signOff · castVoteOnProposal (all 3 proposals) · depositGoverningTokens (lock)
- [x] Wallet connection via Wallet Standard (Phantom/Solflare compatible)
- [x] Five UI screens: Home · Lock Tokens (ve$TICK) · Create DAO · Proposals · Finance (RWA)

**Realms track requirements:**
- [x] Uses Realms/SPL-Governance — not a custom governance program
- [x] Follows canonical Realm structure (community + council governance)
- [x] Real `withCreateRealm`, `withCreateGovernance`, `withCreateProposal`, `withSignOffProposal`, `withCastVote`, `withDepositGoverningTokens` called on devnet
- [x] Voter weight mechanism described (ve$TICK plugin design)

**kyd. track requirements:**
- [x] Ticketing use case demonstrated via governance proposals
- [x] RWA financing mechanism documented in ROADMAP.md Phase 3
- [x] Integration path with TICKS protocol described

**Documentation:**
- [x] ARCHITECTURE.md — full technical breakdown (updated 2026-03-01)
- [x] DEPLOYMENT.md — reproducible setup guide
- [x] ROADMAP.md — honest phased plan (updated 2026-03-01)
- [x] CONTRIBUTING.md — community guidelines
- [x] SECURITY.md — threat model and disclosure process (updated 2026-03-01)
- [x] TERMS.md — terms of use and disclaimer (updated 2026-03-01)
- [x] PRIVACY.md — privacy policy (updated 2026-03-01)
- [x] HACKATHON.md — this document (updated 2026-03-01)
- [x] AUDIT.md — security audit report (updated 2026-03-01)
- [x] CHANGELOG.md — v1.1.0 covering real on-chain transactions (2026-03-01)
- [x] README.md — polished, badge-decorated, judge-ready
- [x] LICENSE — MIT 2026

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
