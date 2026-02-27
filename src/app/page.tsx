'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const GRAVEYARD = [
  { name: 'YellowHeart',  cause: 'Royalty bypass on secondary sales',  fix: 'On-chain custody escrow'       },
  { name: 'TokenProof',   cause: 'ETH gas $50 per check-in',           fix: 'Solana: 100K tickets for $50'  },
  { name: 'GET Protocol', cause: 'No governance — centralized rules',   fix: 've$TICK DAO on Realms'         },
  { name: 'Beanstalk',    cause: '$182M flash loan attack',             fix: '7-day cooloff + 30-day lock'   },
];

const BOOT = [
  '> INITIALIZING TIX-DAO GOVERNANCE PROTOCOL v2.6 ...',
  '> NETWORK: SOLANA DEVNET  ·  SPL-GOVERNANCE: 0.3.28',
  '> STATUS: OPERATIONAL',
];

/* Reusable terminal panel shell */
function Panel({ title, children, accent = false }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{
      border: `1px solid ${accent ? '#3a3a3a' : '#282828'}`,
      background: '#111111',
      boxShadow: accent ? '0 0 48px rgba(255,255,255,0.04)' : 'none',
    }}>
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

export default function HomePage() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Boot log */}
        <div style={{ marginBottom: 36, fontSize: 12, color: '#555555', letterSpacing: '0.04em', lineHeight: 1.9 }}>
          {BOOT.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {/* ── Hero ── */}
        <Panel title="SYSTEM.ALERT" accent>
          <div style={{ padding: '56px 40px', textAlign: 'center' }}>

            <div style={{ fontSize: 11, color: '#4a4a4a', letterSpacing: '0.22em', marginBottom: 24, userSelect: 'none' }}>
              // INCOMING TRANSMISSION FROM THE GRAVEYARD
            </div>

            <h1 style={{
              fontFamily: "ui-monospace, 'Courier New', monospace",
              fontSize: 'clamp(32px, 5.5vw, 60px)',
              fontWeight: 'bold',
              color: '#f2f2f2',
              letterSpacing: '0.04em',
              lineHeight: 1.15,
              marginBottom: 12,
              textShadow: '0 0 40px rgba(255,255,255,0.14)',
            }}>
              TICKETING IS DEAD.
            </h1>

            <h2 style={{
              fontFamily: "ui-monospace, 'Courier New', monospace",
              fontSize: 'clamp(18px, 3vw, 30px)',
              fontWeight: 'normal',
              color: '#aaaaaa',
              letterSpacing: '0.06em',
              marginBottom: 28,
            }}>
              WE&apos;RE BRINGING IT BACK.<span className='blink' style={{ color: '#888888' }}>_</span>
            </h2>

            <p style={{
              color: '#888888',
              fontSize: 14,
              maxWidth: 520,
              margin: '0 auto 44px',
              lineHeight: 1.9,
            }}>
              TIX-DAO lets venues and artists govern their own ticket policies
              on-chain — resale caps, royalty splits, refund windows — decided
              by token holders, not Ticketmaster.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Primary CTA */}
              <Link href='/create' style={{
                display: 'inline-block',
                padding: '12px 36px',
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontFamily: "ui-monospace, 'Courier New', monospace",
                border: '1px solid #606060',
                color: '#e8e8e8',
                background: 'rgba(255,255,255,0.05)',
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#aaaaaa';
                  el.style.color = '#ffffff';
                  el.style.background = 'rgba(255,255,255,0.09)';
                  el.style.boxShadow = '0 0 24px rgba(255,255,255,0.08)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#606060';
                  el.style.color = '#e8e8e8';
                  el.style.background = 'rgba(255,255,255,0.05)';
                  el.style.boxShadow = 'none';
                }}
              >
                [ Enter the DAO ]
              </Link>

              {/* Secondary CTA */}
              <Link href='/proposals' style={{
                display: 'inline-block',
                padding: '12px 36px',
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontFamily: "ui-monospace, 'Courier New', monospace",
                border: '1px solid #333333',
                color: '#888888',
                transition: 'all 0.15s ease',
              }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#555555';
                  el.style.color = '#cccccc';
                  el.style.background = 'rgba(255,255,255,0.04)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#333333';
                  el.style.color = '#888888';
                  el.style.background = 'transparent';
                }}
              >
                [ View Proposals ]
              </Link>
            </div>
          </div>
        </Panel>

        {/* ── Graveyard table ── */}
        <div style={{ marginTop: 48 }}>
          <Panel title="GRAVEYARD.LOG  ·  PROJECTS THAT TRIED AND FAILED">

            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '170px 1fr 1fr',
              padding: '9px 20px',
              borderBottom: '1px solid #1e1e1e',
              background: '#0d0d0d',
              fontSize: 10,
              color: '#444444',
              letterSpacing: '0.2em',
              userSelect: 'none',
            }}>
              <span>PROJECT</span>
              <span>CAUSE_OF_DEATH</span>
              <span>TIX-DAO_FIX</span>
            </div>

            {GRAVEYARD.map((p, i) => (
              <div key={p.name} style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr 1fr',
                padding: '18px 20px',
                borderBottom: i < GRAVEYARD.length - 1 ? '1px solid #1a1a1a' : 'none',
                alignItems: 'center',
                transition: 'background 0.12s',
                cursor: 'default',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ color: '#dedede', fontWeight: 'bold', fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: '#444444', fontSize: 10, marginTop: 3, letterSpacing: '0.1em' }}>
                    STATUS: DECEASED
                  </div>
                </div>
                <div style={{ color: '#b06060', fontSize: 13 }}>
                  <span style={{ color: '#e05555', marginRight: 7 }}>✗</span>{p.cause}
                </div>
                <div style={{ color: '#999999', fontSize: 13 }}>
                  <span style={{ color: '#bbbbbb', marginRight: 7 }}>✓</span>{p.fix}
                </div>
              </div>
            ))}
          </Panel>
        </div>

        <Footer />

      </div>
    </main>
  );
}
