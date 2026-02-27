'use client';

import Link from 'next/link';

export default function NotFoundClient() {
  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh', fontFamily: "ui-monospace, 'Courier New', monospace" }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.2em', marginBottom: 24 }}>
          ERROR_404
        </div>
        <div style={{ fontSize: 48, fontWeight: 'bold', color: '#2a2a2a', marginBottom: 16, letterSpacing: '0.06em' }}>
          404
        </div>
        <div style={{ color: '#666666', fontSize: 14, marginBottom: 8, letterSpacing: '0.06em' }}>
          PAGE NOT FOUND
        </div>
        <div style={{ color: '#444444', fontSize: 12, marginBottom: 48, lineHeight: 1.8 }}>
          // the route you requested does not exist
        </div>
        <Link href='/' style={{
          display: 'inline-block',
          padding: '12px 32px',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textDecoration: 'none',
          border: '1px solid #333333',
          color: '#888888',
          transition: 'all 0.15s',
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
          [ $ cd / ]
        </Link>
      </div>
    </main>
  );
}
