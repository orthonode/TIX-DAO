'use client';

export default function Footer({ showVoteNote = false, realmAddress }: { showVoteNote?: boolean; realmAddress?: string }) {
  return (
    <div style={{ marginTop: 56, textAlign: 'center', userSelect: 'none' }}>
      {realmAddress && (
        <div style={{ fontSize: 11, color: '#333333', letterSpacing: '0.1em', marginBottom: 6 }}>
          <a href={`https://app.realms.today/dao/${realmAddress}?cluster=devnet`}
             target="_blank" rel="noreferrer"
             style={{ color: '#3a5a7a', textDecoration: 'none', borderBottom: '1px solid #2a3a5a' }}
             onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#7a9fd4'; }}
             onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3a5a7a'; }}>
            View on Realms ↗
          </a>
        </div>
      )}
      {showVoteNote && (
        <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 6 }}>
          ALL VOTES ARE ON-CHAIN  ·  GOVERNED BY SPL-GOVERNANCE
        </div>
      )}
      <div style={{ fontSize: 11, color: '#444444', letterSpacing: '0.14em', marginBottom: 6 }}>
        TIX-DAO  ·  SOLANA GRAVEYARD HACKATHON 2026  ·  BUILT ON REALMS
      </div>
      <div style={{ fontSize: 11, color: '#333333', letterSpacing: '0.1em' }}>
        by{' '}
        <a
          href="https://orthonode.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#555555', textDecoration: 'none', borderBottom: '1px solid #333333' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#aaaaaa'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555555'; }}
        >
          Orthonode Infrastructure Labs
        </a>
        {' '}·{' '}
        <a
          href="https://orthonode.xyz"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#444444', textDecoration: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#888888'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444444'; }}
        >
          orthonode.xyz
        </a>
      </div>
    </div>
  );
}
