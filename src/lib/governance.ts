// SPL-Governance constants
import { PublicKey } from '@solana/web3.js';

export const GOVERNANCE_PROGRAM_ID = process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID ||
  'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export const GOVERNANCE_PROGRAM_VERSION = 3;
export const TICK_MINT_DECIMALS = 6;
export const TICK_INITIAL_SUPPLY = 1_000_000; // 1M $TICK

// ve$TICK escrow program (deployed to devnet via Anchor)
export const TICK_ESCROW_PROGRAM_ID = process.env.NEXT_PUBLIC_TICK_ESCROW_PROGRAM_ID ||
  '4zoxHUogrvHXZDfikE17JGbf9zfmNfR4E8YCD8Ltt9st';

// Bytes computed at module-load time — runs BEFORE Phantom's SES lockdown
// Module-level PublicKey construction is safe; runtime construction breaks after SES
export const GOVERNANCE_PROGRAM_ID_BYTES: Uint8Array =
  new PublicKey(GOVERNANCE_PROGRAM_ID).toBytes();

export const TICK_ESCROW_PROGRAM_ID_BYTES: Uint8Array =
  new PublicKey(TICK_ESCROW_PROGRAM_ID).toBytes();
