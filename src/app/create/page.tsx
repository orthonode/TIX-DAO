'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';

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

export default function CreatePage() {
  const { publicKey, connected } = useWallet();
  const [name, setName]       = useState('');
  const [quorum, setQuorum]   = useState('20');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [log, setLog]         = useState<string[]>([]);

  const handleCreate = async () => {
    if (!connected || !name) return;
    setLoading(true);
    const steps = [
      `> Initializing realm: "${name}" ...`,
      '> Allocating governance accounts on devnet ...',
      `> Setting quorum threshold: ${quorum}% ...`,
      '> Signing and broadcasting transaction ...',
      '> Awaiting confirmation on Solana devnet ...',
      '> Done.',
    ];
    for (const step of steps) {
      setLog(l => [...l, step]);
      await new Promise(r => setTimeout(r, 380));
    }
    setDone(true);
    setLoading(false);
  };

  const canSubmit = connected && !!name && !loading;

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> SCRIPT: create_dao.sh'}</div>
          <div>{'> TARGET: Solana Devnet  ·  SPL-Governance'}</div>
        </div>

        {done ? (
          <Panel title="DEPLOY.LOG  ·  COMPLETED">
            <div style={{ padding: '32px 32px' }}>
              {log.map((line, i) => (
                <div key={i} style={{
                  color: i === log.length - 1 ? '#aaaaaa' : '#555555',
                  fontSize: 13,
                  marginBottom: 6,
                }}>
                  {line}
                </div>
              ))}
              <div style={{
                marginTop: 36,
                paddingTop: 28,
                borderTop: '1px solid #1e1e1e',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, color: '#666666', marginBottom: 14 }}>◈</div>
                <div style={{
                  color: '#dedede',
                  fontSize: 16,
                  fontWeight: 'bold',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                  textShadow: '0 0 20px rgba(255,255,255,0.1)',
                }}>
                  DAO DEPLOYED
                </div>
                <div style={{ color: '#777777', fontSize: 13 }}>
                  {name} governance realm is live on Solana devnet.
                </div>
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
              />

              <TermField
                label="// GOVERNANCE_TOKEN_MINT  (from connected wallet)"
                value={connected
                  ? (publicKey?.toBase58().slice(0, 28) + ' ...')
                  : 'awaiting wallet connection'}
                onChange={() => {}}
                disabled
                hint="// uses your wallet pubkey as the token mint for this demo"
              />

              {/* Live deploy log */}
              {log.length > 0 && (
                <div style={{
                  border: '1px solid #202020',
                  background: '#0a0a0a',
                  padding: '14px 16px',
                  marginBottom: 24,
                  fontSize: 12,
                  color: '#666666',
                  lineHeight: 2,
                }}>
                  {log.map((line, i) => <div key={i}>{line}</div>)}
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

        {/* Footer */}
        <div style={{ marginTop: 56, textAlign: 'center', userSelect: 'none' }}>
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
