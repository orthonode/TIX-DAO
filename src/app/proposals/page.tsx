'use client';

import { Suspense, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import Navbar from '@/components/Navbar';
import ProposalCard from '@/components/ProposalCard';
import Footer from '@/components/Footer';
import { castVoteOnProposal } from '@/lib/governanceActions';

const MOCK_PROPOSALS = [
  {
    id: 1,
    title: 'Cap resale price at 150% of face value',
    description: 'Prevent scalping by capping secondary market tickets at 1.5× face value.',
    yes: 847, no: 123, status: 'Active', ends: '2026-03-01',
  },
  {
    id: 2,
    title: 'Set artist royalty at 10% on all resales',
    description: 'Ensure artists earn on every ticket resale, not just primary sales.',
    yes: 1203, no: 89, status: 'Active', ends: '2026-03-03',
  },
  {
    id: 3,
    title: 'Allow 72hr refund window before event',
    description: 'Fans can return tickets up to 72 hours before showtime.',
    yes: 2100, no: 450, status: 'Passed', ends: '2026-02-20',
  },
];

const EXPLORER = 'https://explorer.solana.com';

function ProposalsPageInner() {
  const walletState = useWallet();
  const { connected } = walletState;
  const { connection } = useConnection();
  const params = useSearchParams();

  const realmParam             = params.get('realm');
  const governanceParam        = params.get('governance');
  const proposalParam          = params.get('proposal');
  const proposalOwnerRecord    = params.get('proposalOwnerRecord');
  const mintParam              = params.get('mint');
  const isOnChain = !!(realmParam && governanceParam && proposalParam && proposalOwnerRecord && mintParam);

  const [votes,  setVotes]  = useState<Record<number, 'yes' | 'no'>>({});
  const [counts, setCounts] = useState<Record<number, { yes: number; no: number }>>(
    Object.fromEntries(MOCK_PROPOSALS.map(p => [p.id, { yes: p.yes, no: p.no }]))
  );
  const [txSig,  setTxSig]  = useState('');
  const [voteErr, setVoteErr] = useState('');

  const vote = async (id: number, choice: 'yes' | 'no') => {
    if (!connected || votes[id]) return;

    if (isOnChain) {
      // Real on-chain vote — only for the first proposal (id=1) which maps to the on-chain proposal
      if (id === 1) {
        setVoteErr('');
        try {
          const { txSig: sig } = await castVoteOnProposal(
            connection,
            walletState,
            new PublicKey(realmParam!),
            new PublicKey(governanceParam!),
            new PublicKey(proposalParam!),
            new PublicKey(proposalOwnerRecord!),
            new PublicKey(mintParam!),
            choice,
          );
          setTxSig(sig);
          setVotes(v => ({ ...v, [id]: choice }));
          setCounts(c => ({ ...c, [id]: { ...c[id], [choice]: c[id][choice] + 1 } }));
        } catch (err: unknown) {
          setVoteErr(err instanceof Error ? err.message : String(err));
        }
        return;
      }
    }

    // Mock vote for proposals 2, 3 (or when no URL params)
    setVotes(v  => ({ ...v,  [id]: choice }));
    setCounts(c => ({ ...c, [id]: { ...c[id], [choice]: c[id][choice] + 1 } }));
  };

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> LOADING proposals.json from Solana devnet ...'}</div>
          <div>{`> ${MOCK_PROPOSALS.length} proposals found  ·  ${MOCK_PROPOSALS.filter(p => p.status === 'Active').length} active`}</div>
          {isOnChain && (
            <div style={{ color: '#4a7a34', marginTop: 4 }}>
              {'> on-chain realm detected · proposal #1 votes recorded on Solana devnet'}
            </div>
          )}
        </div>

        {/* On-chain vote feedback */}
        {txSig && (
          <div style={{
            border: '1px solid #2a3a2a', background: '#0d1a0d',
            padding: '12px 16px', marginBottom: 24,
            fontSize: 12, color: '#88cc88', letterSpacing: '0.05em', lineHeight: 1.8,
          }}>
            ✓ Vote recorded on-chain ·{' '}
            <a
              href={`${EXPLORER}/tx/${txSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#7a9fd4', textDecoration: 'none' }}
            >
              View on Solana Explorer ↗
            </a>
          </div>
        )}

        {voteErr && (
          <div style={{
            border: '1px solid #4a1a1a', background: '#1a0808',
            padding: '12px 16px', marginBottom: 24,
            fontSize: 12, color: '#cc4444', letterSpacing: '0.05em', lineHeight: 1.6,
          }}>
            ✗  {voteErr}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {MOCK_PROPOSALS.map((proposal, idx) => (
            <ProposalCard
              key={proposal.id}
              {...proposal}
              index={idx}
              yes={counts[proposal.id].yes}
              no={counts[proposal.id].no}
              myVote={votes[proposal.id]}
              connected={connected}
              onVote={vote}
            />
          ))}
        </div>

        <Footer showVoteNote />
      </div>
    </main>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={null}>
      <ProposalsPageInner />
    </Suspense>
  );
}
