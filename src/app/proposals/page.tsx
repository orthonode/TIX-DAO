'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import ProposalCard from '@/components/ProposalCard';

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

export default function ProposalsPage() {
  const { connected } = useWallet();
  const [votes, setVotes]   = useState<Record<number, 'yes' | 'no'>>({});
  const [counts, setCounts] = useState<Record<number, { yes: number; no: number }>>(
    Object.fromEntries(MOCK_PROPOSALS.map(p => [p.id, { yes: p.yes, no: p.no }]))
  );

  const vote = (id: number, choice: 'yes' | 'no') => {
    if (!connected || votes[id]) return;
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
        </div>

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

        <div style={{ marginTop: 56, textAlign: 'center', userSelect: 'none' }}>
          <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 6 }}>
            ALL VOTES ARE ON-CHAIN  ·  GOVERNED BY SPL-GOVERNANCE
          </div>
          <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 6 }}>
            TIX-DAO  ·  SOLANA GRAVEYARD HACKATHON 2026  ·  BUILT ON REALMS
          </div>
          <div style={{ fontSize: 11, color: '#333333', letterSpacing: '0.1em' }}>
            by{' '}
            <a href="https://orthonode.xyz" target="_blank" rel="noopener noreferrer"
              style={{ color: '#555555', textDecoration: 'none', borderBottom: '1px solid #333333' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#aaaaaa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555555'; }}
            >
              Orthonode Infrastructure Labs
            </a>
            {' '}·{' '}
            <a href="https://orthonode.xyz" target="_blank" rel="noopener noreferrer"
              style={{ color: '#444444', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#888888'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
            >
              orthonode.xyz
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
