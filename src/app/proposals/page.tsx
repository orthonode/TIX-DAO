'use client';

import { Suspense, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import Navbar from '@/components/Navbar';
import ProposalCard from '@/components/ProposalCard';
import Footer from '@/components/Footer';
import { castVoteOnProposal, STANDARD_PROPOSALS } from '@/lib/governanceActions';

const EXPLORER = 'https://explorer.solana.com';

// Initial display counts — on-chain votes accumulate on top of these baselines
const BASELINE = [
  { yes: 847,  no: 123 },
  { yes: 1203, no: 89  },
  { yes: 2100, no: 450 },
];

function NoDAO() {
  return (
    <div style={{
      border: '1px solid #282828', background: '#111111',
      padding: '40px 32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, color: '#333333', marginBottom: 16 }}>◈</div>
      <div style={{ fontSize: 13, color: '#555555', letterSpacing: '0.1em', marginBottom: 10 }}>
        NO DAO CONNECTED
      </div>
      <div style={{ fontSize: 12, color: '#3a3a3a', lineHeight: 1.8, marginBottom: 24 }}>
        Deploy a venue DAO first to see its live proposals.
        <br />Voting is on-chain — each cast creates a VoteRecordV2 PDA on Solana devnet.
      </div>
      <a
        href="/create"
        style={{
          display: 'inline-block',
          border: '1px solid #444444', color: '#aaaaaa',
          padding: '10px 24px', fontSize: 11, letterSpacing: '0.16em',
          textDecoration: 'none', fontFamily: "ui-monospace, 'Courier New', monospace",
        }}
      >
        [ $ ./deploy --network devnet ]
      </a>
    </div>
  );
}

function ProposalsPageInner() {
  const walletState = useWallet();
  const { connected } = walletState;
  const { connection } = useConnection();
  const params = useSearchParams();

  const realmParam          = params.get('realm');
  const governanceParam     = params.get('governance');
  const proposalOwnerRecord = params.get('proposalOwnerRecord');
  const mintParam           = params.get('mint');
  const p1                  = params.get('p1');
  const p2                  = params.get('p2');
  const p3                  = params.get('p3');

  const proposalParams = [p1, p2, p3];
  const isOnChain = !!(realmParam && governanceParam && proposalOwnerRecord && mintParam && p1 && p2 && p3);

  // votes[i] = 'yes' | 'no' once cast
  const [votes,   setVotes]   = useState<Record<number, 'yes' | 'no'>>({});
  const [counts,  setCounts]  = useState(BASELINE.map(b => ({ ...b })));
  const [txSigs,  setTxSigs]  = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [errors,  setErrors]  = useState<Record<number, string>>({});

  const vote = async (id: number, choice: 'yes' | 'no') => {
    if (!connected || votes[id] || loading[id]) return;

    setErrors(e => ({ ...e, [id]: '' }));
    setLoading(l => ({ ...l, [id]: true }));

    try {
      const { txSig } = await castVoteOnProposal(
        connection,
        walletState,
        new PublicKey(realmParam!),
        new PublicKey(governanceParam!),
        new PublicKey(proposalParams[id]!),
        new PublicKey(proposalOwnerRecord!),
        new PublicKey(mintParam!),
        choice,
      );
      setTxSigs(t => ({ ...t, [id]: txSig }));
      setVotes(v => ({ ...v, [id]: choice }));
      setCounts(c => c.map((x, i) =>
        i === id ? { ...x, [choice]: x[choice] + 1 } : x
      ));
    } catch (err: unknown) {
      setErrors(e => ({ ...e, [id]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setLoading(l => ({ ...l, [id]: false }));
    }
  };

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> LOADING governance proposals from Solana devnet ...'}</div>
          {isOnChain ? (
            <>
              <div>{`> ${STANDARD_PROPOSALS.length} proposals found  ·  ${STANDARD_PROPOSALS.length} active`}</div>
              <div style={{ color: '#4a7a34', marginTop: 4 }}>
                {'> on-chain realm detected · votes create VoteRecordV2 PDAs on devnet'}
              </div>
            </>
          ) : (
            <div style={{ color: '#7a5a2a', marginTop: 4 }}>
              {'> no realm params — deploy a DAO at /create to connect live proposals'}
            </div>
          )}
        </div>

        {!isOnChain ? (
          <NoDAO />
        ) : (
          <>
            {/* Per-proposal tx feedback */}
            {Object.entries(txSigs).map(([id, sig]) => (
              <div key={id} style={{
                border: '1px solid #2a3a2a', background: '#0d1a0d',
                padding: '10px 16px', marginBottom: 12,
                fontSize: 12, color: '#88cc88', letterSpacing: '0.05em',
              }}>
                ✓ Proposal #{Number(id) + 1} vote on-chain ·{' '}
                <a
                  href={`${EXPLORER}/tx/${sig}?cluster=devnet`}
                  target="_blank" rel="noreferrer"
                  style={{ color: '#7a9fd4', textDecoration: 'none' }}
                >
                  View on Explorer ↗
                </a>
              </div>
            ))}

            {/* Per-proposal error feedback */}
            {Object.entries(errors).filter(([, msg]) => msg).map(([id, msg]) => (
              <div key={id} style={{
                border: '1px solid #4a1a1a', background: '#1a0808',
                padding: '10px 16px', marginBottom: 12,
                fontSize: 12, color: '#cc4444', letterSpacing: '0.05em',
              }}>
                ✗ Proposal #{Number(id) + 1}: {msg}
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {STANDARD_PROPOSALS.map((title, idx) => (
                <div key={idx}>
                  {loading[idx] && (
                    <div style={{ fontSize: 11, color: '#555555', marginBottom: 6, letterSpacing: '0.1em' }}>
                      {'> casting vote on devnet ...'}
                    </div>
                  )}
                  <ProposalCard
                    id={idx}
                    title={title}
                    description={[
                      'Prevent scalping by capping secondary market tickets at 1.5× face value.',
                      'Ensure artists earn on every ticket resale, not just primary sales.',
                      'Fans can return tickets up to 72 hours before showtime.',
                    ][idx]}
                    yes={counts[idx].yes}
                    no={counts[idx].no}
                    status="Active"
                    ends="2026-04-01"
                    index={idx}
                    myVote={votes[idx]}
                    connected={connected}
                    onVote={vote}
                  />
                </div>
              ))}
            </div>
          </>
        )}

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
