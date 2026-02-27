'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';

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

const BLOCKS = 30;

function BlockBar({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * BLOCKS);
  return (
    <span style={{ fontFamily: "ui-monospace, 'Courier New', monospace", letterSpacing: 1, fontSize: 13 }}>
      <span style={{ color: '#c8c8c8' }}>{'█'.repeat(filled)}</span>
      <span style={{ color: '#252525' }}>{'█'.repeat(BLOCKS - filled)}</span>
    </span>
  );
}

function VoteBtn({
  label,
  voted,
  votedLabel,
  danger,
  disabled,
  onClick,
}: {
  label: string;
  voted: boolean;
  votedLabel: string;
  danger?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const activeColor   = danger ? '#e05555' : '#dedede';
  const activeBorder  = danger ? '#883333' : '#666666';
  const activeBg      = danger ? 'rgba(200,60,60,0.08)' : 'rgba(255,255,255,0.06)';
  const idleColor     = '#666666';
  const idleBorder    = '#282828';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        background:   voted ? activeBg  : 'transparent',
        border:       `1px solid ${voted ? activeBorder : idleBorder}`,
        color:        voted ? activeColor : idleColor,
        padding:      '12px',
        fontSize:     11,
        letterSpacing:'0.16em',
        textTransform:'uppercase',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        fontFamily:   "ui-monospace, 'Courier New', monospace",
        transition:   'all 0.15s',
      }}
      onMouseEnter={e => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background   = voted ? activeBg  : (danger ? 'rgba(200,60,60,0.06)' : 'rgba(255,255,255,0.04)');
        el.style.borderColor  = voted ? activeBorder : (danger ? '#663030' : '#484848');
        el.style.color        = voted ? activeColor  : (danger ? '#cc5555' : '#bbbbbb');
      }}
      onMouseLeave={e => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background  = voted ? activeBg  : 'transparent';
        el.style.borderColor = voted ? activeBorder : idleBorder;
        el.style.color       = voted ? activeColor  : idleColor;
      }}
    >
      {voted ? votedLabel : label}
    </button>
  );
}

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
          {MOCK_PROPOSALS.map((proposal, idx) => {
            const c       = counts[proposal.id];
            const total   = c.yes + c.no;
            const yesPct  = Math.round((c.yes / total) * 100);
            const noPct   = 100 - yesPct;
            const myVote  = votes[proposal.id];
            const isActive = proposal.status === 'Active';

            return (
              <div key={proposal.id} style={{
                border: '1px solid #252525',
                background: '#111111',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#363636'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252525'; }}
              >
                {/* Card header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 18px',
                  borderBottom: '1px solid #1a1a1a',
                  background: '#0d0d0d',
                }}>
                  <span style={{ fontSize: 10, color: '#404040', letterSpacing: '0.16em', userSelect: 'none' }}>
                    ── PROPOSAL_{String(idx + 1).padStart(3, '0')} {'─'.repeat(20)}
                  </span>
                  <span style={{
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    padding: '3px 10px',
                    border: `1px solid ${isActive ? '#404040' : '#262626'}`,
                    color: isActive ? '#888888' : '#444444',
                    userSelect: 'none',
                  }}>
                    {proposal.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ padding: '22px 24px' }}>

                  {/* Title */}
                  <h3 style={{
                    color: '#e0e0e0',
                    fontSize: 15,
                    fontWeight: 'bold',
                    marginBottom: 8,
                    lineHeight: 1.45,
                    letterSpacing: '0.02em',
                  }}>
                    {proposal.title}
                  </h3>

                  {/* Description */}
                  <p style={{
                    color: '#777777',
                    fontSize: 13,
                    marginBottom: 22,
                    lineHeight: 1.75,
                  }}>
                    // {proposal.description}
                  </p>

                  {/* Progress block */}
                  <div style={{
                    border: '1px solid #1e1e1e',
                    background: '#0d0d0d',
                    padding: '14px 18px',
                    marginBottom: 18,
                  }}>
                    <div style={{ marginBottom: 10 }}>
                      <BlockBar pct={yesPct} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: '#aaaaaa' }}>
                        YES&nbsp; {yesPct}%
                        <span style={{ color: '#555555', marginLeft: 8 }}>({c.yes.toLocaleString()} votes)</span>
                      </span>
                      <span style={{ color: '#aa5555' }}>
                        NO&nbsp; {noPct}%
                        <span style={{ color: '#555555', marginLeft: 8 }}>({c.no.toLocaleString()} votes)</span>
                      </span>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#383838', letterSpacing: '0.08em' }}>
                      CLOSES: {proposal.ends}  ·  TOTAL: {total.toLocaleString()} votes
                    </div>
                  </div>

                  {/* Vote buttons */}
                  {isActive && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <VoteBtn
                        label='[ Vote Yes ]'
                        votedLabel='✓  Voted Yes'
                        voted={myVote === 'yes'}
                        disabled={!connected || !!myVote}
                        onClick={() => vote(proposal.id, 'yes')}
                      />
                      <VoteBtn
                        label='[ Vote No ]'
                        votedLabel='✓  Voted No'
                        voted={myVote === 'no'}
                        danger
                        disabled={!connected || !!myVote}
                        onClick={() => vote(proposal.id, 'no')}
                      />
                    </div>
                  )}

                  {!connected && isActive && (
                    <div style={{ fontSize: 12, color: '#555555', marginTop: 12, letterSpacing: '0.06em' }}>
                      // connect wallet to cast your vote
                    </div>
                  )}

                </div>
              </div>
            );
          })}
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
