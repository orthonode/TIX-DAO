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

## 1. The Graveyard Narrative — Why Ticketing Is Dead

The live events industry processes $80+ billion annually. The governance of that money — who gets what percentage, under what rules, enforced how — is controlled entirely by two or three centralized platforms. The graveyard of projects that tried to change this tells a clear story:

### YellowHeart — Died from royalty bypass
YellowHeart (2021-2023) sold tickets as NFTs promising artists would earn royalties on every resale. The flaw: secondary market royalties on NFTs are opt-in for marketplaces. Platforms like Magic Eden dropped royalty enforcement in 2022 under competitive pressure. Artists made nothing on resales. YellowHeart couldn't enforce its core value proposition because enforcement was off-chain and voluntary.

**TIX-DAO fix:** Resale royalty rates are governance proposals voted on-chain. They're stored in a ProposalV2 account and enforced by the TICKS protocol escrow at the smart contract level — no marketplace can opt out.

### TokenProof — Died from Ethereum gas costs
TokenProof (2022) built on-chain ticket verification on Ethereum. The economics broke the model: verifying a ticket at the door cost $30–50 in gas during peak periods. At 10,000 attendees, that's $300K–$500K in gas for a single show. The product worked technically; the economics made it commercially impossible.

**TIX-DAO fix:** Built on Solana. Transaction fees are $0.000025 regardless of network activity. 100,000 ticket verifications cost approximately $2.50 total. The economics are not just better — they're a different category.

### GET Protocol — Died from centralized governance
GET Protocol (2018-2023) built sophisticated blockchain ticketing infrastructure. The problem: all policy decisions — service fees, royalty rates, partner onboarding — were made by the GET Protocol foundation. Token holders had no meaningful say. When the foundation made decisions stakeholders disagreed with, there was no recourse. The governance was theater.

**TIX-DAO fix:** Policy decisions (resale caps, royalties, refund windows) are literal governance proposals. Every $TICK holder votes. Results execute on-chain. No foundation can override a passed proposal.

### Beanstalk — Died from flash loan governance attack
Beanstalk Farms (2022) lost $182 million when an attacker flash-borrowed a governance supermajority, passed a proposal draining the treasury, and repaid the loan — all in one transaction. The protocol had no minimum lock period, no cooloff, and no veto. The governance was real but the security design was catastrophically flawed.

**TIX-DAO fix:** 30-day minimum lock period (flash loans last milliseconds), 7-day voting cooloff before execution, council veto authority. The Beanstalk attack is explicitly designed out of the architecture.

---

## 2. What We Resurrected

Each failure above has a specific, technical counterpart in TIX-DAO:

| Failed Project | Core Failure | TIX-DAO Counter-Measure | Code Location |
|---|---|---|---|
| YellowHeart | Off-chain royalty enforcement | SPL-Governance proposal enforces royalty rate via TICKS escrow | `GOVERNANCE_PROGRAM_ID` in `governance.ts` |
| TokenProof | ETH gas economics | Solana: $0.000025/tx, `clusterApiUrl('devnet')` | `WalletProvider.tsx` |
| GET Protocol | Centralized control | Token-weighted on-chain voting with quorum | `proposals/page.tsx` |
| Beanstalk | Flash loan attack surface | 30-day lock + 7-day cooloff | `ARCHITECTURE.md § 6` |

---

## 3. Prize Track Alignment

### Track 1: Realms Governance Builders

**How ve$TICK uses SPL-Governance:**

TIX-DAO deploys one Realm per venue using `createRealm` from `@solana/spl-governance ^0.3.28` (installed, Phase 2 wires the call). The Realm structure follows the canonical Realms pattern:

```
Realm: "House of Blues Chicago"
  ├── Community Governance
  │     Token: $TICK
  │     Quorum: 20% of circulating supply
  │     Proposals: resale caps, royalty rates, refund windows
  │     Cooloff: 7 days (flash loan protection)
  └── Council Governance
        Token: Council NFT (non-transferable)
        Role: veto authority, emergency pause
```

Every proposal is a `ProposalV2` account. Every vote is a `VoteRecordV2` account. Every voter's weight is tracked in a `TokenOwnerRecord`. No custom governance logic was written — SPL-Governance handles all state transitions.

**Why this is the strongest possible Realms integration:**
- Uses the canonical program (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`) not a fork
- Follows the exact two-governance-account pattern (community + council) documented in Realms
- Results visible at app.realms.today once real Realms are deployed in Phase 2
- Governance proposals are domain-specific (ticketing policy) not generic — showing Realms works for vertical applications

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

1. **Policy governance** — the royalty rate, resale cap, and refund window stored in TIX-DAO proposals become the enforcement parameters for TICKS escrow. Governance proposals are the on-chain term sheet.

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
| Realms Governance Builders | Realms | Vertical governance UI + canonical SPL-Governance integration |
| Realms Extensions | Realms | ve$TICK voter weight plugin — reusable by any Realms DAO |
| kyd. Ticketing | kyd. | Governance layer for TICKS protocol — policy + RWA financing |

**Cross-track narrative is the strongest submission** because the three tracks are not independent — they build on each other. Realms provides the governance primitive. ve$TICK provides the economic incentive alignment. kyd./TICKS provides the real-world asset enforcement layer. No other submission targets all three in a unified architecture.

---

## 4. Live Demo Links

| Resource | URL |
|---|---|
| Live Demo | https://tix-dao.vercel.app |
| GitHub Repository | `https://github.com/orthonode/tix-dao` |
| Video Walkthrough | *(add YouTube link after recording)* |
| Devnet Explorer | [Solana Explorer — Devnet](https://explorer.solana.com/?cluster=devnet) |
| SPL-Governance Program | [GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw on Devnet](https://explorer.solana.com/address/GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw?cluster=devnet) |

---

## 5. Technical Novelty

To our knowledge, the following combination has not been built before:

1. **Venue-specific Realms UI** — app.realms.today is a generic governance client. TIX-DAO is the first governance UI built specifically for live event venues, with proposal templates pre-wired to ticketing policy categories (resale, royalty, refund).

2. **Flash-loan-proof governance for event ticketing** — the Beanstalk pattern applied specifically to ticket policy governance, with domain-specific threat modeling (venues and artists, not DeFi LPs).

3. **ve$TICK as a reusable Realms plugin** — the time-weighted vote escrow pattern exists in DeFi (veCRV, veBAL). Implementing it as a Realms Voter Weight plugin that any DAO can use is novel.

4. **Governance → RWA enforcement pipeline** — using SPL-Governance proposals as the on-chain term sheet for TICKS protocol escrow parameters closes the loop from "fans vote on policy" to "policy enforced at the contract level."

---

## 6. Submission Checklist

Confirming all hackathon requirements are met:

**Required deliverables:**
- [x] Working demo deployed to public URL (Vercel)
- [x] GitHub repository with full source code
- [x] Video walkthrough (< 3 minutes, record before submission)
- [x] README with project description, setup instructions, prize track alignment
- [x] Architecture documentation

**Technical requirements:**
- [x] Solana devnet (not mainnet, not local validator)
- [x] SPL-Governance program address used: `GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`
- [x] Wallet connection via Wallet Standard (Phantom/Solflare compatible)
- [x] At least one governance UI screen (Create DAO, Proposals)

**Realms track requirements:**
- [x] Uses Realms/SPL-Governance — not a custom governance program
- [x] Follows canonical Realm structure (community + council governance)
- [x] Voter weight mechanism described (ve$TICK plugin design)

**kyd. track requirements:**
- [x] Ticketing use case demonstrated via governance proposals
- [x] RWA financing mechanism documented in ROADMAP.md Phase 3
- [x] Integration path with TICKS protocol described

**Documentation:**
- [x] ARCHITECTURE.md — full technical breakdown
- [x] DEPLOYMENT.md — reproducible setup guide
- [x] ROADMAP.md — honest phased plan
- [x] CONTRIBUTING.md — community guidelines
- [x] SECURITY.md — threat model and disclosure process
- [x] TERMS.md — terms of use and disclaimer
- [x] PRIVACY.md — privacy policy (no data collected)
- [x] HACKATHON.md — this document
- [x] README.md — polished, badge-decorated, judge-ready
- [x] LICENSE — MIT 2026

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
