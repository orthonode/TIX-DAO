'use client';

import { Suspense, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useSearchParams } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { lockTokens } from '@/lib/governanceActions';
import { TICK_MINT_DECIMALS } from '@/lib/governance';

const LOCK_OPTIONS = [
  { days: 30,  label: '30 DAYS',  multiplier: 1, tag: 'CASUAL'    },
  { days: 90,  label: '90 DAYS',  multiplier: 2, tag: 'SUPPORTER' },
  { days: 180, label: '180 DAYS', multiplier: 3, tag: 'PARTNER'   },
  { days: 365, label: '365 DAYS', multiplier: 4, tag: 'CORE'      },
];

const EXPLORER = 'https://explorer.solana.com';

interface DoneState {
  txSig: string;
  tokenOwnerRecord: string;
}

function LockPageInner() {
  const walletState = useWallet();
  const { connected } = walletState;
  const { connection } = useConnection();
  const params = useSearchParams();

  const realmParam = params.get('realm');
  const mintParam  = params.get('mint');
  const hasParams  = !!(realmParam && mintParam);

  const [selected, setSelected] = useState<number>(365);
  const [amount,   setAmount]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState<DoneState | null>(null);
  const [error,    setError]    = useState('');

  const option      = LOCK_OPTIONS.find(o => o.days === selected) ?? LOCK_OPTIONS[LOCK_OPTIONS.length - 1];
  const parsed      = parseFloat(amount) || 0;
  const votingPower = parsed * option.multiplier;

  const handleLock = async () => {
    if (!connected || !parsed || !hasParams) return;
    setLoading(true);
    setError('');

    try {
      const realmPk = new PublicKey(realmParam!);
      const mintPk  = new PublicKey(mintParam!);
      const rawAmount = BigInt(Math.floor(parsed * 10 ** TICK_MINT_DECIMALS));
      const { txSig, tokenOwnerRecord } = await lockTokens(
        connection,
        walletState,
        realmPk,
        mintPk,
        new BN(rawAmount.toString()),
      );
      setDone({ txSig, tokenOwnerRecord: tokenOwnerRecord.toBase58() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = connected && parsed > 0 && hasParams && !loading && !done;

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> SCRIPT: lock_tokens.sh  ·  ve$TICK escrow'}</div>
          <div>{'> PROTOCOL: vote-escrowed $TICK  ·  flash-loan-proof governance'}</div>
        </div>

        {/* No params warning */}
        {!hasParams && (
          <div style={{
            border: '1px solid #3a2800', background: '#1c1400',
            padding: '12px 16px', marginBottom: 28,
            fontSize: 12, color: '#c8943a', letterSpacing: '0.05em', lineHeight: 1.6,
          }}>
            ⚠  No DAO params found — <a href="/create" style={{ color: '#e0b060', textDecoration: 'none' }}>create a DAO first at /create</a> to get a shareable lock URL.
          </div>
        )}

        {/* Lock option cards */}
        <div style={{ border: '1px solid #282828', background: '#111111', marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d',
          }}>
            <span style={{ color: '#383838', userSelect: 'none', fontSize: 11 }}>──</span>
            <span style={{ fontSize: 10, color: '#555555', letterSpacing: '0.18em', userSelect: 'none' }}>
              SELECT_LOCK_DURATION
            </span>
            <span style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
          </div>

          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {LOCK_OPTIONS.map(opt => {
              const active = selected === opt.days;
              return (
                <button
                  key={opt.days}
                  onClick={() => setSelected(opt.days)}
                  style={{
                    background:   active ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border:       `1px solid ${active ? '#606060' : '#252525'}`,
                    padding:      '18px 20px',
                    textAlign:    'left',
                    cursor:       'pointer',
                    fontFamily:   "ui-monospace, 'Courier New', monospace",
                    transition:   'all 0.15s',
                    boxShadow:    active ? '0 0 20px rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (active) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#404040';
                    el.style.background  = 'rgba(255,255,255,0.02)';
                  }}
                  onMouseLeave={e => {
                    if (active) return;
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#252525';
                    el.style.background  = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: active ? '#e0e0e0' : '#888888', fontWeight: 'bold', letterSpacing: '0.06em' }}>
                      {opt.label}
                    </span>
                    <span style={{
                      fontSize: 10, letterSpacing: '0.14em',
                      padding: '2px 8px',
                      border: `1px solid ${active ? '#505050' : '#252525'}`,
                      color: active ? '#aaaaaa' : '#444444',
                    }}>
                      {opt.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 22, color: active ? '#f0f0f0' : '#666666', fontWeight: 'bold', marginBottom: 4 }}>
                    {opt.multiplier}×
                  </div>
                  <div style={{ fontSize: 11, color: active ? '#888888' : '#444444', letterSpacing: '0.08em' }}>
                    voting power multiplier
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount + power */}
        <div style={{ border: '1px solid #282828', background: '#111111', marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d',
          }}>
            <span style={{ color: '#383838', userSelect: 'none', fontSize: 11 }}>──</span>
            <span style={{ fontSize: 10, color: '#555555', letterSpacing: '0.18em', userSelect: 'none' }}>
              AMOUNT_AND_POWER
            </span>
            <span style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: '#555555', letterSpacing: '0.16em', marginBottom: 10, userSelect: 'none' }}>
                // $TICK_AMOUNT
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #333333', paddingBottom: 10 }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#666666'; }}
                onBlurCapture={e  => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#333333'; }}
              >
                <span style={{ color: '#444444', marginRight: 10, fontSize: 14, userSelect: 'none' }}>{'>'}</span>
                <input
                  type='number'
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder='e.g. 1000'
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#dedede', fontSize: 14,
                    fontFamily: "ui-monospace, 'Courier New', monospace",
                    width: '100%', caretColor: '#aaaaaa',
                  }}
                />
                <span style={{ color: '#555555', fontSize: 12, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>$TICK</span>
              </div>
            </div>

            <div style={{ border: '1px solid #1e1e1e', background: '#0d0d0d', padding: '16px 20px' }}>
              <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 8 }}>
                PROJECTED VOTING POWER
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: 32, fontWeight: 'bold',
                  color: votingPower > 0 ? '#e0e0e0' : '#2a2a2a',
                  transition: 'color 0.2s', letterSpacing: '0.02em',
                }}>
                  {votingPower > 0 ? votingPower.toLocaleString() : '0'}
                </span>
                <span style={{ fontSize: 13, color: '#555555', letterSpacing: '0.1em' }}>ve$TICK</span>
              </div>
              <div style={{ fontSize: 11, color: '#383838', marginTop: 6, letterSpacing: '0.08em' }}>
                {parsed > 0
                  ? `${parsed.toLocaleString()} $TICK  ×  ${option.multiplier}×  (${option.label} lock)`
                  : 'enter an amount above'}
              </div>
            </div>
          </div>
        </div>

        {/* Status / error */}
        {!connected && (
          <div style={{
            border: '1px solid #3a2800', background: '#1c1400',
            padding: '12px 16px', marginBottom: 20,
            fontSize: 12, color: '#c8943a', letterSpacing: '0.05em', lineHeight: 1.6,
          }}>
            ⚠  WALLET NOT CONNECTED — click <strong style={{ color: '#e0b060' }}>Connect Wallet</strong> in the top-right
          </div>
        )}

        {error && (
          <div style={{
            border: '1px solid #4a1a1a', background: '#1a0808',
            padding: '12px 16px', marginBottom: 20,
            fontSize: 12, color: '#cc4444', letterSpacing: '0.05em', lineHeight: 1.6,
          }}>
            ✗  {error}
          </div>
        )}

        {done ? (
          <div style={{ border: '1px solid #2a3a2a', background: '#0d1a0d', padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>✅</div>
            <div style={{ color: '#88cc88', fontSize: 16, fontWeight: 'bold', letterSpacing: '0.12em', marginBottom: 8 }}>
              TOKENS LOCKED
            </div>
            <div style={{ color: '#667766', fontSize: 13, marginBottom: 16 }}>
              {parsed.toLocaleString()} $TICK locked for {option.label.toLowerCase()} · {votingPower.toLocaleString()} ve$TICK granted
            </div>
            <a
              href={`${EXPLORER}/tx/${done.txSig}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', fontSize: 12, color: '#7a9fd4', textDecoration: 'none', marginBottom: 8 }}
            >
              View transaction on Solana Explorer ↗
            </a>
            <div style={{ marginTop: 12, fontSize: 11, color: '#445544', letterSpacing: '0.08em' }}>
              TOKEN OWNER RECORD  ·  {done.tokenOwnerRecord.slice(0, 20)}...
            </div>
          </div>
        ) : (
          <button
            onClick={handleLock}
            disabled={!canSubmit}
            style={{
              width: '100%',
              background: canSubmit ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${canSubmit ? '#555555' : '#282828'}`,
              color: canSubmit ? '#dedede' : '#3e3e3e',
              padding: '14px 24px',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: "ui-monospace, 'Courier New', monospace",
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!canSubmit) return;
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = '#888888';
              el.style.color = '#f0f0f0';
              el.style.background = 'rgba(255,255,255,0.07)';
              el.style.boxShadow = '0 0 20px rgba(255,255,255,0.06)';
            }}
            onMouseLeave={e => {
              if (!canSubmit) return;
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = '#555555';
              el.style.color = '#dedede';
              el.style.background = 'rgba(255,255,255,0.04)';
              el.style.boxShadow = 'none';
            }}
          >
            {loading ? '[ locking tokens on devnet ... ]' : '[ $ ./lock-tokens --escrow devnet ]'}
          </button>
        )}

        <Footer />

      </div>
    </main>
  );
}

export default function LockPage() {
  return (
    <Suspense fallback={null}>
      <LockPageInner />
    </Suspense>
  );
}
