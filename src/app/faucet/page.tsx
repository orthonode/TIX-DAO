'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const EXPLORER = 'https://explorer.solana.com';

export default function FaucetPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [step,   setStep]   = useState<'idle' | 'requesting' | 'done' | 'error'>('idle');
  const [txSig,  setTxSig]  = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [log,    setLog]    = useState<string[]>([]);

  const addLog = (line: string) => setLog(prev => [...prev, line]);

  const handleAirdrop = async () => {
    if (!connected || !publicKey || step === 'requesting') return;
    setStep('requesting');
    setLog([]);
    setErrMsg('');

    try {
      addLog('> requesting 2 SOL airdrop from devnet ...');
      const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      addLog(`  airdrop tx: ${sig.slice(0, 20)}...`);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

      addLog('  ✓ 2 SOL received');
      setTxSig(sig);
      setStep('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const rpcUnavailable = /rate|limit|429|too many|internal/i.test(msg);
      setErrMsg(rpcUnavailable
        ? 'Devnet RPC airdrop unavailable. Use an external faucet below.'
        : msg);
      setStep('error');
    }
  };

  const canRequest = connected && step !== 'requesting' && step !== 'done';

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> SCRIPT: faucet.sh  ·  devnet SOL dispenser'}</div>
          <div>{'> NETWORK: Solana Devnet  ·  2 SOL per request  ·  rate limited'}</div>
        </div>

        {/* Info panel */}
        <div style={{ border: '1px solid #282828', background: '#111111', padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: '#555555', letterSpacing: '0.18em', marginBottom: 12 }}>INFO</div>
          <div style={{ fontSize: 12, color: '#666666', lineHeight: 1.9 }}>
            <div>SOL is needed to pay for transaction fees on Solana devnet.</div>
            <div style={{ marginTop: 6 }}>After receiving SOL, visit{' '}
              <a href="/create" style={{ color: '#7a9fd4', textDecoration: 'none' }}>/create</a>
              {' '}to deploy a venue DAO and get $TICK tokens.</div>
          </div>
        </div>

        {/* Wallet guard */}
        {!connected && (
          <div style={{
            border: '1px solid #3a2800', background: '#1c1400',
            padding: '12px 16px', marginBottom: 20,
            fontSize: 12, color: '#c8943a', letterSpacing: '0.05em',
          }}>
            ⚠  WALLET NOT CONNECTED — click <strong style={{ color: '#e0b060' }}>Connect Wallet</strong> in the top-right
          </div>
        )}

        {/* Log output */}
        {log.length > 0 && (
          <div style={{
            border: '1px solid #1e2a1e', background: '#0d130d',
            padding: '16px 20px', marginBottom: 20,
            fontSize: 12, color: '#88aa88', letterSpacing: '0.05em', lineHeight: 2,
          }}>
            {log.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div style={{
            border: '1px solid #4a1a1a', background: '#1a0808',
            padding: '16px 20px', marginBottom: 20,
            fontSize: 12, color: '#cc4444', letterSpacing: '0.05em', lineHeight: 1.8,
          }}>
            <div>✗  {errMsg}</div>
            {publicKey && (
              <div style={{ marginTop: 12, color: '#888888', fontSize: 11 }}>
                <div style={{ marginBottom: 6, color: '#555555' }}>external faucets (paste your address):</div>
                <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", color: '#666666', marginBottom: 8, wordBreak: 'break-all' }}>
                  {publicKey.toBase58()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <a href={`https://faucet.solana.com`} target="_blank" rel="noreferrer"
                     style={{ color: '#7a9fd4', textDecoration: 'none' }}>
                    → faucet.solana.com ↗
                  </a>
                  <a href="https://faucet.quicknode.com/solana/devnet" target="_blank" rel="noreferrer"
                     style={{ color: '#7a9fd4', textDecoration: 'none' }}>
                    → faucet.quicknode.com ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {step === 'done' && (
          <div style={{
            border: '1px solid #2a3a2a', background: '#0d1a0d',
            padding: '28px 32px', textAlign: 'center', marginBottom: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 14 }}>✅</div>
            <div style={{ color: '#88cc88', fontSize: 14, letterSpacing: '0.12em', marginBottom: 8 }}>2 SOL RECEIVED</div>
            <a href={`${EXPLORER}/tx/${txSig}?cluster=devnet`} target="_blank" rel="noreferrer"
               style={{ fontSize: 12, color: '#7a9fd4', textDecoration: 'none' }}>
              View transaction on Solana Explorer ↗
            </a>
            <div style={{ marginTop: 20 }}>
              <a href="/create" style={{
                fontSize: 12, color: '#888888', textDecoration: 'none',
                border: '1px solid #444444', padding: '10px 24px',
                display: 'inline-block', letterSpacing: '0.12em',
              }}>
                [ $ ./deploy --network devnet ]
              </a>
            </div>
          </div>
        )}

        {/* Action button */}
        {step !== 'done' && (
          <button onClick={handleAirdrop} disabled={!canRequest} style={{
            width: '100%',
            background: canRequest ? 'rgba(255,255,255,0.04)' : 'transparent',
            border: `1px solid ${canRequest ? '#555555' : '#282828'}`,
            color: canRequest ? '#dedede' : '#3e3e3e',
            padding: '14px 24px', fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: canRequest ? 'pointer' : 'not-allowed',
            fontFamily: "ui-monospace, 'Courier New', monospace", transition: 'all 0.15s',
          }}>
            {step === 'requesting' ? '[ requesting airdrop ... ]' : '[ $ ./airdrop --amount 2 --network devnet ]'}
          </button>
        )}

        <Footer />
      </div>
    </main>
  );
}
