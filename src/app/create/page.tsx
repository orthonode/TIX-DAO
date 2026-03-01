'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  createTickMint,
  createRealmWithDeposit,
  createGovernanceAndProposal,
} from '@/lib/governanceActions';

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #282828', background: '#111111' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 18px',
        borderBottom: '1px solid #1e1e1e',
        background: '#0d0d0d',
      }}>
        <span style={{ color: '#383838', userSelect: 'none', fontSize: 11 }}>──</span>
        <span style={{ fontSize: 10, color: '#555555', letterSpacing: '0.18em', userSelect: 'none' }}>{title}</span>
        <span style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
      </div>
      {children}
    </div>
  );
}

function TermField({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, color: '#555555', letterSpacing: '0.16em', marginBottom: 10, userSelect: 'none' }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${disabled ? '#222222' : '#333333'}`,
        paddingBottom: 10,
      }}
        onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#666666'; }}
        onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = disabled ? '#222222' : '#333333'; }}
      >
        <span style={{ color: '#444444', marginRight: 10, fontSize: 14, userSelect: 'none' }}>{'>'}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: disabled ? '#555555' : '#dedede',
            fontSize: 14,
            fontFamily: "ui-monospace, 'Courier New', monospace",
            width: '100%',
            caretColor: '#aaaaaa',
          }}
        />
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: '#444444', marginTop: 7, letterSpacing: '0.08em' }}>{hint}</div>
      )}
    </div>
  );
}

type LogLine = { text: string; color?: string };

interface SuccessState {
  mintPk: string;
  realmPk: string;
  governancePk: string;
  proposalPk: string;
  proposalOwnerRecord: string;
  tx1: string;
  tx2: string;
  tx3: string;
}

const EXPLORER = 'https://explorer.solana.com';

function explorerTx(sig: string) {
  return `${EXPLORER}/tx/${sig}?cluster=devnet`;
}

function explorerAccount(pk: string) {
  return `${EXPLORER}/address/${pk}?cluster=devnet`;
}

export default function CreatePage() {
  const walletState = useWallet();
  const { publicKey, connected } = walletState;
  const { connection } = useConnection();

  const [name, setName]       = useState('');
  const [quorum, setQuorum]   = useState('60');
  const [loading, setLoading] = useState(false);
  const [log, setLog]         = useState<LogLine[]>([]);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copied, setCopied]   = useState(false);

  const addLog = (text: string, color?: string) =>
    setLog(l => [...l, { text, color }]);

  const handleCreate = async () => {
    if (!connected || !publicKey || !name) return;
    setLoading(true);
    setLog([]);
    setSuccess(null);

    try {
      // ── TX1 ──────────────────────────────────────────────────────────────
      addLog('> Minting $TICK token on devnet...');
      const { mintKeypair, txSig: tx1 } = await createTickMint(connection, walletState);
      addLog(`  ✓ $TICK minted — ${mintKeypair.publicKey.toBase58().slice(0, 16)}...`, '#88cc88');

      // ── TX2 ──────────────────────────────────────────────────────────────
      addLog(`> Deploying governance realm: "${name}" ...`);
      const { realmPk, txSig: tx2 } = await createRealmWithDeposit(
        connection,
        walletState,
        name,
        mintKeypair.publicKey,
      );
      addLog(`  ✓ Realm deployed — ${realmPk.toBase58().slice(0, 16)}...`, '#88cc88');

      // ── TX3 ──────────────────────────────────────────────────────────────
      addLog('> Creating governance + seeding proposals...');
      const { governancePk, proposalPk, proposalOwnerRecord, txSig: tx3 } =
        await createGovernanceAndProposal(
          connection,
          walletState,
          realmPk,
          mintKeypair.publicKey,
          `${name} Genesis Proposal`,
          Number(quorum) || 60,
        );
      addLog(`  ✓ Governance + proposal live`, '#88cc88');
      addLog('> Done.', '#aaaaaa');

      setSuccess({
        mintPk:              mintKeypair.publicKey.toBase58(),
        realmPk:             realmPk.toBase58(),
        governancePk:        governancePk.toBase58(),
        proposalPk:          proposalPk.toBase58(),
        proposalOwnerRecord: proposalOwnerRecord.toBase58(),
        tx1, tx2, tx3,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`  ✗ ${msg}`, '#cc4444');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = connected && !!name && !loading;

  const proposalsUrl = success
    ? `/proposals?realm=${success.realmPk}&governance=${success.governancePk}&proposal=${success.proposalPk}&proposalOwnerRecord=${success.proposalOwnerRecord}&mint=${success.mintPk}`
    : '';

  const lockUrl = success
    ? `/lock?realm=${success.realmPk}&mint=${success.mintPk}`
    : '';

  const handleCopy = () => {
    if (!proposalsUrl) return;
    navigator.clipboard.writeText(window.location.origin + proposalsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> SCRIPT: create_dao.sh'}</div>
          <div>{'> TARGET: Solana Devnet  ·  SPL-Governance'}</div>
        </div>

        {success ? (
          <Panel title="DEPLOY.LOG  ·  COMPLETED">
            <div style={{ padding: '32px 32px' }}>
              {/* Log lines */}
              {log.map((line, i) => (
                <div key={i} style={{ color: line.color ?? '#555555', fontSize: 13, marginBottom: 6 }}>
                  {line.text}
                </div>
              ))}

              <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid #1e1e1e', textAlign: 'center' }}>
                <div style={{ fontSize: 32, color: '#666666', marginBottom: 14 }}>◈</div>
                <div style={{
                  color: '#dedede', fontSize: 16, fontWeight: 'bold',
                  letterSpacing: '0.12em', marginBottom: 10,
                  textShadow: '0 0 20px rgba(255,255,255,0.1)',
                }}>
                  DAO DEPLOYED
                </div>
                <div style={{ color: '#777777', fontSize: 13, marginBottom: 28 }}>
                  {name} governance realm is live on Solana devnet.
                </div>
              </div>

              {/* Explorer TX links */}
              <div style={{ border: '1px solid #1e1e1e', background: '#0a0a0a', padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 12 }}>
                  TRANSACTIONS
                </div>
                {[
                  { label: 'TX1 · Mint $TICK', sig: success.tx1 },
                  { label: 'TX2 · Create Realm', sig: success.tx2 },
                  { label: 'TX3 · Governance + Proposal', sig: success.tx3 },
                ].map(({ label, sig }) => (
                  <div key={sig} style={{ marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: '#555555' }}>{label}  </span>
                    <a
                      href={explorerTx(sig)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#7a9fd4', textDecoration: 'none', fontFamily: "ui-monospace, 'Courier New', monospace" }}
                    >
                      {sig.slice(0, 24)}...
                    </a>
                  </div>
                ))}
              </div>

              {/* Realm account */}
              <div style={{ border: '1px solid #1e1e1e', background: '#0a0a0a', padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 12 }}>
                  ACCOUNTS
                </div>
                {[
                  { label: 'Realm', pk: success.realmPk },
                  { label: 'Governance', pk: success.governancePk },
                  { label: 'Proposal', pk: success.proposalPk },
                  { label: '$TICK Mint', pk: success.mintPk },
                ].map(({ label, pk }) => (
                  <div key={pk} style={{ marginBottom: 8, fontSize: 12 }}>
                    <span style={{ color: '#555555' }}>{label}  </span>
                    <a
                      href={explorerAccount(pk)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#7a9fd4', textDecoration: 'none', fontFamily: "ui-monospace, 'Courier New', monospace" }}
                    >
                      {pk.slice(0, 24)}...
                    </a>
                  </div>
                ))}
              </div>

              {/* Shareable URL */}
              <div style={{ border: '1px solid #2a3a1e', background: '#0d1a08', padding: '16px 20px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#4a6a34', letterSpacing: '0.14em', marginBottom: 10 }}>
                  SHARE — PROPOSALS PAGE
                </div>
                <div style={{ fontSize: 11, color: '#7aaa5a', fontFamily: "ui-monospace, 'Courier New', monospace", wordBreak: 'break-all', marginBottom: 14 }}>
                  {window.location.origin + proposalsUrl}
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'transparent',
                    border: '1px solid #3a5a2a',
                    color: '#7aaa5a',
                    padding: '7px 18px',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    cursor: 'pointer',
                    fontFamily: "ui-monospace, 'Courier New', monospace",
                  }}
                >
                  {copied ? '[ COPIED ]' : '[ COPY URL ]'}
                </button>
              </div>

              {/* Lock page link */}
              <div style={{ fontSize: 12, color: '#555555', marginTop: 8 }}>
                {'> Lock tokens: '}
                <a href={lockUrl} style={{ color: '#7a9fd4', textDecoration: 'none' }}>{lockUrl}</a>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title="CREATE_DAO.SH  ·  VENUE GOVERNANCE SETUP">
            <div style={{ padding: '28px 32px' }}>

              {!connected && (
                <div style={{
                  border: '1px solid #3a2800',
                  background: '#1c1400',
                  padding: '12px 16px',
                  marginBottom: 28,
                  fontSize: 12,
                  color: '#c8943a',
                  letterSpacing: '0.05em',
                  lineHeight: 1.6,
                }}>
                  ⚠  WALLET NOT CONNECTED — click <strong style={{ color: '#e0b060' }}>Connect Wallet</strong> in the top-right
                </div>
              )}

              <TermField
                label="// VENUE_NAME"
                value={name}
                onChange={setName}
                placeholder="e.g. House of Blues Chicago"
              />

              <TermField
                label="// QUORUM_THRESHOLD (%)"
                value={quorum}
                onChange={setQuorum}
                type="number"
                hint="// yes-vote percentage required to pass a proposal"
              />

              <TermField
                label="// GOVERNANCE_TOKEN_MINT  (will be created)"
                value={connected
                  ? (publicKey?.toBase58().slice(0, 28) + ' ...')
                  : 'awaiting wallet connection'}
                onChange={() => {}}
                disabled
                hint="// a new $TICK SPL token will be minted to your wallet"
              />

              {/* Live deploy log */}
              {log.length > 0 && (
                <div style={{
                  border: '1px solid #202020',
                  background: '#0a0a0a',
                  padding: '14px 16px',
                  marginBottom: 24,
                  fontSize: 12,
                  lineHeight: 2,
                }}>
                  {log.map((line, i) => (
                    <div key={i} style={{ color: line.color ?? '#666666' }}>{line.text}</div>
                  ))}
                  {loading && <span className='blink' style={{ color: '#aaaaaa' }}>_</span>}
                </div>
              )}

              <button
                onClick={handleCreate}
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
                {loading ? '[ deploying to devnet ... ]' : '[ $ ./deploy --network devnet ]'}
              </button>

            </div>
          </Panel>
        )}

        <Footer />

      </div>
    </main>
  );
}
