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

import {
  GOVERNANCE_PROGRAM_ID,
  GOVERNANCE_PROGRAM_VERSION,
  TICK_MINT_DECIMALS,
  TICK_INITIAL_SUPPLY,
} from './governance';

// Lazy — avoids module-level PublicKey construction before polyfills are ready
let _programId: PublicKey | null = null;
function getProgramId(): PublicKey {
  if (!_programId) _programId = new PublicKey(GOVERNANCE_PROGRAM_ID);
  return _programId;
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

// ── TX3: Create governance + proposal + sign off (starts voting) ─────────────

export async function createGovernanceAndProposal(
  connection: Connection,
  wallet: WalletContextState,
  realmPk: PublicKey,
  mintPk: PublicKey,
  proposalTitle: string,
  quorumPct: number,
): Promise<{
  governancePk: PublicKey;
  proposalPk: PublicKey;
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
    undefined,  // governedAccount — not governing a specific account
    config,
    tokenOwnerRecord,
    payer,
    payer,      // createAuthority
  );

  const proposalPk = await withCreateProposal(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    governancePk,
    tokenOwnerRecord,
    proposalTitle,
    '',           // descriptionLink
    mintPk,
    payer,        // governanceAuthority
    0,            // proposalIndex
    VoteType.SINGLE_CHOICE,
    ['Approve'],
    true,         // useDenyOption
    payer,
  );

  withSignOffProposal(
    instructions,
    getProgramId(),
    GOVERNANCE_PROGRAM_VERSION,
    realmPk,
    governancePk,
    proposalPk,
    payer,        // signatory
    undefined,    // signatoryRecord — auto-derived when undefined
    tokenOwnerRecord, // proposalOwnerRecord
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: payer }).add(...instructions);

  const sig = await wallet.sendTransaction(tx, connection);
  await confirm(connection, sig, blockhash, lastValidBlockHeight);

  return { governancePk, proposalPk, proposalOwnerRecord: tokenOwnerRecord, txSig: sig };
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
