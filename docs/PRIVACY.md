# TIX-DAO — Privacy Policy

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Network](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)
[![Built With](https://img.shields.io/badge/Built%20With-Realms-4F46E5.svg)](https://realms.today)
[![Hackathon](https://img.shields.io/badge/Graveyard%20Hack-2026-22C55E.svg)](./HACKATHON.md)
[![Status](https://img.shields.io/badge/Status-Live-22C55E.svg)](https://tix-dao.vercel.app)
[![By](https://img.shields.io/badge/By-Orthonode%20Labs-orange.svg)](https://orthonode.xyz)

**Effective date:** 2026-02-27
**Operator:** Orthonode Infrastructure Labs · orthonode.xyz · Bhopal, Madhya Pradesh, India

---

## 1. Summary

TIX-DAO is a **static, serverless web application**. It has no backend, no database, and no user accounts. Orthonode Infrastructure Labs does not collect, store, or process any personal information about users.

The short version: **we don't know who you are, and we don't track you.**

---

## 2. What TIX-DAO Does NOT Collect

- No names, email addresses, or contact information
- No passwords or authentication credentials
- No IP addresses (TIX-DAO itself has no server to log them)
- No cookies set by TIX-DAO
- No analytics or tracking scripts injected by TIX-DAO
- No private keys — ever. The interface never requests, reads, or transmits wallet private keys

---

## 3. Wallet Public Addresses

When you connect a browser wallet (Phantom, Solflare, Backpack, or any Wallet Standard compatible wallet):

- TIX-DAO reads your wallet's **public address** to display it in the governance token mint field
- Your public address is **not sent to any TIX-DAO server** — the application is static and has no server to receive it
- Your public address is **not stored** beyond your browser session
- Public addresses are, by their nature, public — they are visible to anyone who inspects on-chain data on Solana

The wallet connection is handled entirely by your browser extension. TIX-DAO calls the Wallet Standard adapter API (`@solana/wallet-adapter-react`). The wallet extension manages key storage, signing, and approval flows independently of TIX-DAO.

---

## 4. On-Chain Data

When real on-chain transactions are supported (Phase 2+):

- Votes cast, proposals created, and DAO configurations are recorded permanently and publicly on the Solana blockchain
- Blockchain data is public by design — your wallet address and voting history will be visible to anyone querying the Solana network
- TIX-DAO cannot delete on-chain data. Blockchain records are immutable.

In the current MVP (Phase 1), all governance interactions are simulated in browser state only. Nothing is written to the blockchain.

---

## 5. Solana RPC Calls

TIX-DAO connects to `api.devnet.solana.com` (Solana's public devnet RPC endpoint) to query blockchain state. These requests:

- Include your wallet's public address when querying account balances or token holdings
- Are sent directly from your browser to Solana's RPC infrastructure
- Are subject to Solana Labs / Anza's own data practices

For production use with a custom RPC endpoint (Helius, QuickNode), those providers' privacy policies apply to RPC-level data.

---

## 6. Hosting — Vercel

TIX-DAO is deployed on [Vercel](https://vercel.com). Vercel, as the hosting provider, may collect:

- Standard web server access logs (IP address, request path, user agent, timestamp)
- Performance and edge network metrics

This data is collected by Vercel under their own [Privacy Policy](https://vercel.com/legal/privacy-policy) and [Terms of Service](https://vercel.com/legal/terms), not by Orthonode Infrastructure Labs. Orthonode Infrastructure Labs does not have access to individual visitor-level data from Vercel's infrastructure logs.

---

## 7. Browser Wallet Extensions

Browser wallet extensions (Phantom, Solflare, Backpack, etc.) operate independently of TIX-DAO. Each wallet extension:

- Has its own data storage, its own encryption, and its own privacy policy
- Manages your private keys entirely within its own sandboxed context
- May transmit telemetry or usage data to its own servers per its own policy

TIX-DAO does not control, influence, or have visibility into wallet extension data practices. Review the privacy policy of your specific wallet extension before use.

---

## 8. No Third-Party Analytics

TIX-DAO does not use:

- Google Analytics or Google Tag Manager
- Mixpanel, Amplitude, Segment, or any product analytics platform
- Facebook Pixel or any advertising tracking
- Any fingerprinting or cross-site tracking technology

---

## 9. Cookies

TIX-DAO does not set any cookies. Your browser may store wallet connection state locally (set by your wallet extension, not by TIX-DAO). You can clear this via your browser's developer tools.

---

## 10. Children

TIX-DAO is not directed at children under 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect data from minors. If you believe a minor has used TIX-DAO in a context that creates a data concern, contact us at the address below.

---

## 11. Changes to this Policy

This privacy policy may be updated as the protocol moves from hackathon prototype to production (Phase 2+), particularly when real on-chain transactions are introduced. Material changes will be noted in the project changelog. The effective date at the top of this document will be updated accordingly.

---

## 12. Contact

For privacy questions or concerns: [orthonode.xyz](https://orthonode.xyz) · [@orthonode](https://twitter.com/orthonode)

---

*TIX-DAO · Solana Graveyard Hackathon 2026 · Built on Realms · by [Orthonode Infrastructure Labs](https://orthonode.xyz) · orthonode.xyz*
