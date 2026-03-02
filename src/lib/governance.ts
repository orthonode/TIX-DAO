// SPL-Governance constants

export const GOVERNANCE_PROGRAM_ID = process.env.NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID ||
  'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw';

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export const GOVERNANCE_PROGRAM_VERSION = 3;
export const TICK_MINT_DECIMALS = 6;
export const TICK_INITIAL_SUPPLY = 1_000_000; // 1M $TICK

// ve$TICK escrow program (deployed to devnet via Anchor)
export const TICK_ESCROW_PROGRAM_ID = process.env.NEXT_PUBLIC_TICK_ESCROW_PROGRAM_ID ||
  '4zoxHUogrvHXZDfikE17JGbf9zfmNfR4E8YCD8Ltt9st';

// Pre-computed byte arrays — avoids bs58.decode at runtime which SES lockdown (Phantom)
// corrupts by freezing the BASE_MAP Uint8Array after page load.
// These must be kept in sync with the default program ID strings above.
// GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw
export const GOVERNANCE_PROGRAM_ID_BYTES = new Uint8Array([
  234,228,53,189,238,117,183,52,205,89,62,207,154,48,75,128,
  36,186,40,152,103,183,105,177,249,60,167,187,184,142,70,254,
]);

// 4zoxHUogrvHXZDfikE17JGbf9zfmNfR4E8YCD8Ltt9st
export const TICK_ESCROW_PROGRAM_ID_BYTES = new Uint8Array([
  59,98,65,204,18,29,61,251,198,216,181,58,133,138,47,233,
  150,254,3,43,216,3,193,63,200,53,31,77,100,99,46,111,
]);
