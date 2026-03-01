'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FinancePage() {
  const { connected } = useWallet();
  const [revenue,    setRevenue]    = useState('');
  const [advancePct, setAdvancePct] = useState('70');
  const [termSheet,  setTermSheet]  = useState(false);

  const rev      = parseFloat(revenue.replace(/,/g, '')) || 0;
  const pct      = Math.min(Math.max(parseFloat(advancePct) || 0, 0), 90);
  const loan     = Math.round(rev * (pct / 100));
  const fee      = Math.round(loan * 0.035);         // 3.5% origination
  const repay    = loan + fee;
  const yield_   = ((fee / loan) * 100).toFixed(1);  // lender yield

  const hasCalc  = rev > 0 && pct > 0;
  const canSubmit = connected && hasCalc && !termSheet;

  const handleRequest = () => {
    if (!canSubmit) return;
    setTermSheet(true);
  };

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot context */}
        <div style={{ marginBottom: 32, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          <div>{'> SCRIPT: rwa_finance.sh  ·  venue advance protocol'}</div>
          <div>{'> MODEL: ticket RWA collateral  ·  TICKS protocol integration'}</div>
        </div>

        {/* Input panel */}
        <div style={{ border: '1px solid #282828', background: '#111111', marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 18px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d',
          }}>
            <span style={{ color: '#383838', userSelect: 'none', fontSize: 11 }}>──</span>
            <span style={{ fontSize: 10, color: '#555555', letterSpacing: '0.18em', userSelect: 'none' }}>
              VENUE_FINANCING_PARAMETERS
            </span>
            <span style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
          </div>

          <div style={{ padding: '28px 32px' }}>

            {!connected && (
              <div style={{
                border: '1px solid #3a2800', background: '#1c1400',
                padding: '12px 16px', marginBottom: 28,
                fontSize: 12, color: '#c8943a', letterSpacing: '0.05em', lineHeight: 1.6,
              }}>
                ⚠  WALLET NOT CONNECTED — click <strong style={{ color: '#e0b060' }}>Connect Wallet</strong> in the top-right
              </div>
            )}

            {/* Expected revenue */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: '#555555', letterSpacing: '0.16em', marginBottom: 10, userSelect: 'none' }}>
                // EXPECTED_TICKET_REVENUE  (USD)
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #333333', paddingBottom: 10 }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#666666'; }}
                onBlurCapture={e  => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#333333'; }}
              >
                <span style={{ color: '#444444', marginRight: 10, fontSize: 14, userSelect: 'none' }}>$</span>
                <input
                  type='number'
                  value={revenue}
                  min='0'
                  onChange={e => setRevenue(e.target.value)}
                  placeholder='e.g. 50000'
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#dedede', fontSize: 14,
                    fontFamily: "ui-monospace, 'Courier New', monospace",
                    width: '100%', caretColor: '#aaaaaa',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#444444', marginTop: 7, letterSpacing: '0.08em' }}>
                // total projected revenue from upcoming event ticket sales
              </div>
            </div>

            {/* Advance % */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, color: '#555555', letterSpacing: '0.16em', marginBottom: 10, userSelect: 'none' }}>
                // ADVANCE_NEEDED  (% of revenue, max 90%)
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #333333', paddingBottom: 10 }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#666666'; }}
                onBlurCapture={e  => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#333333'; }}
              >
                <span style={{ color: '#444444', marginRight: 10, fontSize: 14, userSelect: 'none' }}>{'>'}</span>
                <input
                  type='number'
                  value={advancePct}
                  onChange={e => setAdvancePct(e.target.value)}
                  min={1} max={90}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: '#dedede', fontSize: 14,
                    fontFamily: "ui-monospace, 'Courier New', monospace",
                    width: '100%', caretColor: '#aaaaaa',
                  }}
                />
                <span style={{ color: '#555555', fontSize: 12, letterSpacing: '0.1em' }}>%</span>
              </div>
            </div>

            {/* Output calc */}
            <div style={{
              border: '1px solid #1e1e1e', background: '#0d0d0d',
              padding: '18px 20px',
            }}>
              <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 14 }}>
                CALCULATED OUTPUT
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                {[
                  { label: 'LOAN AMOUNT',   value: hasCalc ? `$${loan.toLocaleString()}`  : '—' },
                  { label: 'REPAYMENT',     value: hasCalc ? `$${repay.toLocaleString()}` : '—' },
                  { label: 'LENDER YIELD',  value: hasCalc ? `${yield_}%`                 : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: '#444444', letterSpacing: '0.16em', marginBottom: 6 }}>{label}</div>
                    <div style={{
                      fontSize: 22, fontWeight: 'bold',
                      color: hasCalc ? '#dedede' : '#2a2a2a',
                      letterSpacing: '0.02em', transition: 'color 0.2s',
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              {hasCalc && (
                <div style={{ marginTop: 14, fontSize: 11, color: '#383838', letterSpacing: '0.08em' }}>
                  ORIGINATION FEE: 3.5%  ·  COLLATERAL: TICKET RWAs (TICKS PROTOCOL)  ·  REPAYMENT: AUTO FROM ESCROW
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Request button */}
        <button
          onClick={handleRequest}
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
            marginBottom: 24,
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
          {'[ $ ./request-advance --collateral ticks ]'}
        </button>

        {/* Term sheet */}
        {termSheet && (
          <div style={{
            border: '1px solid #2e3a2e',
            background: '#0d150d',
            padding: '28px 32px',
            animation: 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: '#557755', letterSpacing: '0.18em' }}>TERM_SHEET.JSON</div>
              <div style={{ fontSize: 10, color: '#3a5a3a', letterSpacing: '0.14em', padding: '3px 10px', border: '1px solid #2a4a2a' }}>
                DRAFT
              </div>
            </div>

            <div style={{ fontFamily: "ui-monospace, 'Courier New', monospace", fontSize: 12, lineHeight: 2, color: '#557755' }}>
              <div><span style={{ color: '#3a5a3a' }}>borrower</span>        <span style={{ color: '#88aa88' }}>→</span>  connected wallet (venue operator)</div>
              <div><span style={{ color: '#3a5a3a' }}>loan_amount</span>     <span style={{ color: '#88aa88' }}>→</span>  <span style={{ color: '#aaccaa' }}>${loan.toLocaleString()} USDC</span></div>
              <div><span style={{ color: '#3a5a3a' }}>advance_rate</span>    <span style={{ color: '#88aa88' }}>→</span>  {pct}% of projected ticket revenue</div>
              <div><span style={{ color: '#3a5a3a' }}>collateral</span>      <span style={{ color: '#88aa88' }}>→</span>  ticket RWAs via TICKS protocol escrow</div>
              <div><span style={{ color: '#3a5a3a' }}>origination_fee</span> <span style={{ color: '#88aa88' }}>→</span>  3.5% (${fee.toLocaleString()} USDC)</div>
              <div><span style={{ color: '#3a5a3a' }}>repayment</span>       <span style={{ color: '#88aa88' }}>→</span>  <span style={{ color: '#aaccaa' }}>${repay.toLocaleString()} USDC</span> — auto from ticket sale escrow</div>
              <div><span style={{ color: '#3a5a3a' }}>lender_yield</span>    <span style={{ color: '#88aa88' }}>→</span>  {yield_}% net</div>
              <div><span style={{ color: '#3a5a3a' }}>governance</span>      <span style={{ color: '#88aa88' }}>→</span>  terms ratified by DAO proposal on Realms</div>
              <div><span style={{ color: '#3a5a3a' }}>network</span>         <span style={{ color: '#88aa88' }}>→</span>  Solana devnet</div>
              <div><span style={{ color: '#3a5a3a' }}>status</span>          <span style={{ color: '#88aa88' }}>→</span>  <span style={{ color: '#88cc88', fontWeight: 'bold' }}>ADVANCE REQUESTED ✅</span></div>
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e2e1e', fontSize: 11, color: '#3a5a3a', letterSpacing: '0.08em' }}>
              CALCULATOR ONLY  ·  TICKS PROTOCOL DISBURSEMENT SHIPS PHASE 3  ·  SOLANA DEVNET
            </div>
          </div>
        )}

        <Footer />

      </div>
    </main>
  );
}
