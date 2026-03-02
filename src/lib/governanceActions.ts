// On-chain SPL-Governance helpers — Solana devnet

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import BN from 'bn.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  withCreateRealm,
  withDepositGoverningTokens,
  withCreateGovernance,
  withCreateProposal,
  withSignOffProposal,
  withCastVote,
  getTokenOwnerRecordAddress,
  MintMaxVoteWeightSource,
  GovernanceConfig,
  VoteThreshold,
  VoteThresholdType,
  VoteTipping,
  VoteType,
  Vote,
  VoteKind,
  VoteChoice,
} from '@solana/spl-governance';

import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import tickEscrowIdl from './tick_escrow_idl.json';
import {
  GOVERNANCE_PROGRAM_VERSION,
  TICK_MINT_DECIMALS,
  TICK_INITIAL_SUPPLY,
  GOVERNANCE_PROGRAM_ID_BYTES,
  TICK_ESCROW_PROGRAM_ID_BYTES,
} from './governance';

// Program ID PublicKeys — constructed from module-level bytes (safe after SES lockdown)
// The bytes themselves are computed at module load time in governance.ts before SES runs
let _programId: PublicKey | null = null;
function getProgramId(): PublicKey {
  if (!_programId) _programId = new PublicKey(GOVERNANCE_PROGRAM_ID_BYTES);
  return _programId;
}

let _escrowProgramId: PublicKey | null = null;
function getEscrowProgramId(): PublicKey {
  if (!_escrowProgramId) _escrowProgramId = new PublicKey(TICK_ESCROW_PROGRAM_ID_BYTES);
  return _escrowProgramId;
}

async function confirm(
  connection: Connection,
  sig: string,
  blockhash: string,
  lastValidBlockHeight: number,
) {
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    'confirmed',
  );
}

// ── TX1: Create the $TICK SPL token mint ────────────────────────────────────

export async function createTickMint(
  connection: Connection,
  wallet: WalletContextState,
): Promise<{ mintKeypair: Keypair; txSig: string }> {
  const payer = wallet.publicKey!;
  const mintKeypair = Keypair.generate();
  const mintPk = mintKeypair.publicKey;

  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  const ata = getAssociatedTokenAddressSync(mintPk, payer);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer });
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintPk,
      space: MINT_SIZE,
      lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mintPk, TICK_MINT_DECIMALS, payer, null),
    createAssociatedTokenAccountInstruction(payer, ata, payer, mintPk),
    createMintToInstruction(
      mintPk,
      ata,
      payer,
      BigInt(TICK_INITIAL_SUPPLY) * BigInt(10 ** TICK_MINT_DECIMALS),
    ),
  );

  // Mint keypair must co-sign the createAccount instruction
  tx.partialSign(mintKeypair);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return { mintKeypair, txSig: sig };
}

// ── TX2: Create realm + deposit 1 token (creates tokenOwnerRecord PDA) ──────

export async function createRealmWithDeposit(
  connection: Connection,
  wallet: WalletContextState,
  name: string,
  mintPk: PublicKey,
): Promise<{ realmPk: PublicKey; txSig: string }> {
  const payer = wallet.publicKey!;
  const instructions: TransactionInstruction[] = [];

  const realmPk = await withCreateRealm(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    name,
    payer,      // realmAuthority
    mintPk,
    payer,      // payer
    undefined,  // no council mint
    MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION,
    new BN(1),  // minCommunityWeightToCreateGovernance
  );

  const ata = getAssociatedTokenAddressSync(mintPk, payer);

  await withDepositGoverningTokens(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    ata,    // governingTokenSource (ATA holding $TICK)
    mintPk,
    payer,  // governingTokenOwner
    payer,  // governingTokenSourceAuthority
    payer,
    new BN(1),
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer }).add(...instructions);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return { realmPk, txSig: sig };
}

// Standard TIX-DAO governance proposals — created on-chain in TX3
export const STANDARD_PROPOSALS = [
  'Cap resale at 150% of face value',
  'Set artist royalty at 10% on resales',
  'Allow 72hr refund window before event',
] as const;

// ── TX3: Create governance + 3 proposals + sign off all (starts voting) ──────

export async function createGovernanceAndProposal(
  connection: Connection,
  wallet: WalletContextState,
  realmPk: PublicKey,
  mintPk: PublicKey,
  quorumPct: number,
): Promise<{
  governancePk: PublicKey;
  proposalPks: [PublicKey, PublicKey, PublicKey];
  proposalOwnerRecord: PublicKey;
  txSig: string;
}> {
  const payer = wallet.publicKey!;
  const instructions: TransactionInstruction[] = [];

  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    getProgramId(),
    realmPk,
    mintPk,
    payer,
  );

  const config = new GovernanceConfig({
    communityVoteThreshold: new VoteThreshold({
      type: VoteThresholdType.YesVotePercentage,
      value: quorumPct,
    }),
    minCommunityTokensToCreateProposal: new BN(1),
    minInstructionHoldUpTime: 0,
    baseVotingTime: 86400, // 1 day
    communityVoteTipping: VoteTipping.Strict,
    minCouncilTokensToCreateProposal: new BN(1),
    councilVoteThreshold: new VoteThreshold({ type: VoteThresholdType.Disabled }),
    councilVetoVoteThreshold: new VoteThreshold({ type: VoteThresholdType.Disabled }),
    communityVetoVoteThreshold: new VoteThreshold({ type: VoteThresholdType.Disabled }),
    councilVoteTipping: VoteTipping.Strict,
    votingCoolOffTime: 0,
    depositExemptProposalCount: 10,
  });

  const governancePk = await withCreateGovernance(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    SystemProgram.programId,  // deterministic governed account — avoids random PDA each call
    config,
    tokenOwnerRecord,
    payer,
    payer,      // createAuthority
  );

  // Create all 3 standard TIX-DAO proposals in the same transaction
  const proposalPks: PublicKey[] = [];
  for (let i = 0; i < STANDARD_PROPOSALS.length; i++) {
    const pk = await withCreateProposal(
      instructions,
      getProgramId(),
      GOVERNANCE_PROGRAM_VERSION,
      realmPk,
      governancePk,
      tokenOwnerRecord,
      STANDARD_PROPOSALS[i],
      '',         // descriptionLink
      mintPk,
      payer,      // governanceAuthority
      i,          // proposalIndex
      VoteType.SINGLE_CHOICE,
      ['Approve'],
      true,       // useDenyOption
      payer,
    );
    proposalPks.push(pk);
  }

  // Sign off all 3 proposals so voting starts immediately
  for (const pk of proposalPks) {
    withSignOffProposal(
      instructions,
      getProgramId(),
      GOVERNANCE_PROGRAM_VERSION,
      realmPk,
      governancePk,
      pk,
      payer,          // signatory
      undefined,      // signatoryRecord — auto-derived
      tokenOwnerRecord,
    );
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer }).add(...instructions);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return {
    governancePk,
    proposalPks: proposalPks as [PublicKey, PublicKey, PublicKey],
    proposalOwnerRecord: tokenOwnerRecord,
    txSig: sig,
  };
}

// ── Lock page: deposit more tokens ──────────────────────────────────────────

export async function lockTokens(
  connection: Connection,
  wallet: WalletContextState,
  realmPk: PublicKey,
  mintPk: PublicKey,
  amount: BN,
): Promise<{ txSig: string; tokenOwnerRecord: PublicKey }> {
  const payer = wallet.publicKey!;
  const instructions: TransactionInstruction[] = [];

  const ata = getAssociatedTokenAddressSync(mintPk, payer);

  const tokenOwnerRecord = await withDepositGoverningTokens(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    ata,
    mintPk,
    payer,
    payer,
    payer,
    amount,
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer }).add(...instructions);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return { txSig: sig, tokenOwnerRecord };
}

// ── Proposals page: cast a vote ─────────────────────────────────────────────

export async function castVoteOnProposal(
  connection: Connection,
  wallet: WalletContextState,
  realmPk: PublicKey,
  governancePk: PublicKey,
  proposalPk: PublicKey,
  proposalOwnerRecord: PublicKey,
  mintPk: PublicKey,
  choice: 'yes' | 'no',
): Promise<{ txSig: string }> {
  const payer = wallet.publicKey!;
  const instructions: TransactionInstruction[] = [];

  const tokenOwnerRecord = await getTokenOwnerRecordAddress(
    getProgramId(),
    realmPk,
    mintPk,
    payer,
  );

  const vote =
    choice === 'yes'
      ? new Vote({
          voteType: VoteKind.Approve,
          approveChoices: [new VoteChoice({ rank: 0, weightPercentage: 100 })],
          deny: undefined,
          veto: undefined,
        })
      : new Vote({
          voteType: VoteKind.Deny,
          approveChoices: undefined,
          deny: true,
          veto: undefined,
        });

  await withCastVote(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    governancePk,
    proposalPk,
    proposalOwnerRecord,
    tokenOwnerRecord,
    payer,   // governanceAuthority
    mintPk,
    vote,
    payer,
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer }).add(...instructions);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return { txSig: sig };
}

// ── ve$TICK Escrow: lock tokens ──────────────────────────────────────────────

export async function lockTokensEscrow(
  connection: Connection,
  wallet: WalletContextState,
  mintPk: PublicKey,
  amount: BN,
  lockDurationDays: 30 | 90 | 180 | 365,
): Promise<{ txSig: string }> {
  const payer     = wallet.publicKey!;
  const programId = getEscrowProgramId();

  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tick_escrow'), payer.toBytes(), mintPk.toBytes()],
    programId,
  );

  const ownerAta  = getAssociatedTokenAddressSync(mintPk, payer);
  const escrowAta = getAssociatedTokenAddressSync(mintPk, escrowPda, true);

  const anchorWallet = {
    publicKey:           payer,
    signTransaction:     wallet.signTransaction!,
    signAllTransactions: wallet.signAllTransactions!,
  };
  const provider = new AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' });
  const program  = new Program(tickEscrowIdl as unknown as Idl, provider);

  const txSig = await (program.methods as any)
    .lockTokens(amount, lockDurationDays)
    .accounts({
      owner:                  payer,
      escrowAccount:          escrowPda,
      tickMint:               mintPk,
      ownerTickAta:           ownerAta,
      escrowTickAta:          escrowAta,
      tokenProgram:           TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:          SystemProgram.programId,
    })
    .rpc();

  return { txSig };
}

// ── ve$TICK Escrow: unlock tokens ────────────────────────────────────────────

export async function unlockTokensEscrow(
  connection: Connection,
  wallet: WalletContextState,
  mintPk: PublicKey,
): Promise<{ txSig: string }> {
  const payer     = wallet.publicKey!;
  const programId = getEscrowProgramId();

  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tick_escrow'), payer.toBytes(), mintPk.toBytes()],
    programId,
  );

  const ownerAta  = getAssociatedTokenAddressSync(mintPk, payer);
  const escrowAta = getAssociatedTokenAddressSync(mintPk, escrowPda, true);

  const anchorWallet = {
    publicKey:           payer,
    signTransaction:     wallet.signTransaction!,
    signAllTransactions: wallet.signAllTransactions!,
  };
  const provider = new AnchorProvider(connection, anchorWallet, { commitment: 'confirmed' });
  const program  = new Program(tickEscrowIdl as unknown as Idl, provider);

  const txSig = await (program.methods as any)
    .unlockTokens()
    .accounts({
      owner:                  payer,
      escrowAccount:          escrowPda,
      tickMint:               mintPk,
      ownerTickAta:           ownerAta,
      escrowTickAta:          escrowAta,
      tokenProgram:           TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram:          SystemProgram.programId,
    })
    .rpc();

  return { txSig };
}

// ── ve$TICK Escrow: read state (direct buffer parsing, no Anchor Program.account) ─

export async function getEscrowState(
  connection: Connection,
  owner: PublicKey,
  mintPk: PublicKey,
): Promise<{
  exists: boolean;
  lockedAmount?: number;
  lockEndTs?: number;
  multiplierBps?: number;
  isExpired?: boolean;
}> {
  const programId = getEscrowProgramId();
  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('tick_escrow'), owner.toBytes(), mintPk.toBytes()],
    programId,
  );

  const info = await connection.getAccountInfo(escrowPda);
  if (!info) return { exists: false };

  // Layout: 8 (discriminator) + 32 (owner) + 32 (tick_mint) + 8 (locked_amount u64 LE)
  //       + 8 (lock_end_ts i64 LE) + 2 (multiplier_bps u16 LE) + 1 (bump u8)
  const d             = Buffer.from(info.data);
  const lockedAmount  = Number(d.readBigUInt64LE(8 + 32 + 32));
  const lockEndTs     = Number(d.readBigInt64LE(8 + 32 + 32 + 8));
  const multiplierBps = d.readUInt16LE(8 + 32 + 32 + 8 + 8);
  const nowTs         = Math.floor(Date.now() / 1000);

  return {
    exists:       true,
    lockedAmount: lockedAmount / 10 ** TICK_MINT_DECIMALS,
    lockEndTs,
    multiplierBps,
    isExpired:    nowTs >= lockEndTs,
  };
}
