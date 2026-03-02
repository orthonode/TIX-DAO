'use client';

import { Suspense, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { lockTokensEscrow, unlockTokensEscrow, getEscrowState } from '@/lib/governanceActions';
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

interface EscrowInfo {
  lockedAmount: number;
  lockEndTs: number;
  multiplierBps: number;
  isExpired: boolean;
}

function LockPageInner() {
  const walletState = useWallet();
  const { connected } = walletState;
  const { connection } = useConnection();
  const params = useSearchParams();
  const router = useRouter();

  const mintParam  = params.get('mint');
  const hasParams  = !!mintParam;

  // Auto-load mint from last deployed DAO if no URL params
  useEffect(() => {
    if (hasParams) return;
    try {
      const saved = localStorage.getItem('tix_dao_last');
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.mintPk && d.realmPk) {
        router.replace(`/lock?realm=${d.realmPk}&mint=${d.mintPk}`);
      }
    } catch { /* localStorage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selected,       setSelected]       = useState<number>(365);
  const [amount,         setAmount]         = useState('');
  const [loading,        setLoading]        = useState(false);
  const [done,           setDone]           = useState<DoneState | null>(null);
  const [error,          setError]          = useState('');
  const [existingEscrow, setExistingEscrow] = useState<EscrowInfo | null>(null);
  const [escrowLoading,  setEscrowLoading]  = useState(false);
  const [unlockLoading,  setUnlockLoading]  = useState(false);
  const [unlockDone,     setUnlockDone]     = useState<{ txSig: string } | null>(null);

  const option      = LOCK_OPTIONS.find(o => o.days === selected) ?? LOCK_OPTIONS[LOCK_OPTIONS.length - 1];
  const parsed      = parseFloat(amount) || 0;
  const votingPower = parsed * option.multiplier;

  // Check for existing escrow on connect
  useEffect(() => {
    if (!connected || !walletState.publicKey || !mintParam) return;
    setEscrowLoading(true);
    getEscrowState(connection, walletState.publicKey, new PublicKey(mintParam))
      .then(s => { if (s.exists) setExistingEscrow(s as EscrowInfo); })
      .catch(() => {})
      .finally(() => setEscrowLoading(false));
  }, [connected, walletState.publicKey, mintParam, connection]);

  const handleLock = async () => {
    if (!connected || !parsed || !hasParams) return;
    setLoading(true);
    setError('');

    try {
      const mintPk   = new PublicKey(mintParam!);
      const rawAmount = BigInt(Math.floor(parsed * 10 ** TICK_MINT_DECIMALS));
      const { txSig } = await lockTokensEscrow(
        connection,
        walletState,
        mintPk,
        new BN(rawAmount.toString()),
        selected as 30 | 90 | 180 | 365,
      );
      setDone({ txSig, tokenOwnerRecord: '' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!connected || !mintParam || !existingEscrow?.isExpired) return;
    setUnlockLoading(true);
    try {
      const { txSig } = await unlockTokensEscrow(connection, walletState, new PublicKey(mintParam));
      setUnlockDone({ txSig });
      setExistingEscrow(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUnlockLoading(false);
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

        {/* Mint verification banner */}
        {hasParams && (
          <div style={{
            border: '1px solid #3a2800', background: '#131000',
            padding: '14px 18px', marginBottom: 20,
            fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.9,
          }}>
            <div style={{ color: '#c8943a', marginBottom: 6, letterSpacing: '0.14em' }}>
              ⚠  VERIFY TOKEN MINT BEFORE LOCKING
            </div>
            <div style={{ color: '#7a6030', marginBottom: 8 }}>
              Duplicate venue names are possible. Only lock $TICK tokens if you confirmed
              this mint address matches what the venue published on their official channels.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ color: '#555555' }}>$TICK MINT</span>
              <span style={{
                fontFamily: "ui-monospace, 'Courier New', monospace",
                color: '#e0b060', fontSize: 11, wordBreak: 'break-all',
              }}>
                {mintParam}
              </span>
            </div>
          </div>
        )}

        {/* Existing escrow panel */}
        {escrowLoading && (
          <div style={{ fontSize: 12, color: '#555555', marginBottom: 16 }}>{'> checking existing escrow ...'}</div>
        )}

        {existingEscrow && (
          <div style={{ border: '1px solid #283828', background: '#0d150d', padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: '#4a6a34', letterSpacing: '0.18em', marginBottom: 14 }}>ACTIVE_ESCROW</div>
            <div style={{ fontSize: 12, color: '#88aa88', lineHeight: 2 }}>
              <div>locked  →  {existingEscrow.lockedAmount.toLocaleString()} $TICK</div>
              <div>multiplier  →  {existingEscrow.multiplierBps / 100}×</div>
              <div>unlocks  →  {new Date(existingEscrow.lockEndTs * 1000).toLocaleDateString()}</div>
              <div>status  →  {existingEscrow.isExpired ? '✓ EXPIRED — ready to unlock' : '🔒 locked'}</div>
            </div>
            {existingEscrow.isExpired && (
              <button onClick={handleUnlock} disabled={unlockLoading} style={{
                marginTop: 16, width: '100%', background: 'transparent',
                border: '1px solid #446644', color: '#88cc88',
                padding: '12px 24px', fontSize: 12, letterSpacing: '0.14em',
                cursor: 'pointer', fontFamily: "ui-monospace, 'Courier New', monospace",
              }}>
                {unlockLoading ? '[ unlocking ... ]' : '[ $ ./unlock-tokens --escrow devnet ]'}
              </button>
            )}
            {unlockDone && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#88cc88' }}>
                ✓ Tokens unlocked ·{' '}
                <a href={`${EXPLORER}/tx/${unlockDone.txSig}?cluster=devnet`} target="_blank" rel="noreferrer"
                   style={{ color: '#7a9fd4', textDecoration: 'none' }}>View on Explorer ↗</a>
              </div>
            )}
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
            {done.tokenOwnerRecord && (
              <div style={{ marginTop: 12, fontSize: 11, color: '#445544', letterSpacing: '0.08em' }}>
                TOKEN OWNER RECORD  ·  {done.tokenOwnerRecord.slice(0, 20)}...
              </div>
            )}
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
