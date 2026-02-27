'use client';

const BLOCKS = 30;

function BlockBar({ pct }: { pct: number }) {
  const filled = Math.round((pct / 100) * BLOCKS);
  return (
    <span style={{ fontFamily: "ui-monospace, 'Courier New', monospace", letterSpacing: 1, fontSize: 13 }}>
      <span style={{ color: '#c8c8c8' }}>{'█'.repeat(filled)}</span>
      <span style={{ color: '#252525' }}>{'█'.repeat(BLOCKS - filled)}</span>
    </span>
  );
}

function VoteBtn({
  label, voted, votedLabel, danger, disabled, onClick,
}: {
  label: string; voted: boolean; votedLabel: string;
  danger?: boolean; disabled: boolean; onClick: () => void;
}) {
  const activeColor  = danger ? '#e05555' : '#dedede';
  const activeBorder = danger ? '#883333' : '#666666';
  const activeBg     = danger ? 'rgba(200,60,60,0.08)' : 'rgba(255,255,255,0.06)';
  const idleColor    = '#666666';
  const idleBorder   = '#282828';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        background:    voted ? activeBg  : 'transparent',
        border:        `1px solid ${voted ? activeBorder : idleBorder}`,
        color:         voted ? activeColor : idleColor,
        padding:       '12px',
        fontSize:      11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        cursor:        disabled ? 'not-allowed' : 'pointer',
        fontFamily:    "ui-monospace, 'Courier New', monospace",
        transition:    'all 0.15s',
      }}
      onMouseEnter={e => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background  = voted ? activeBg  : (danger ? 'rgba(200,60,60,0.06)' : 'rgba(255,255,255,0.04)');
        el.style.borderColor = voted ? activeBorder : (danger ? '#663030' : '#484848');
        el.style.color       = voted ? activeColor  : (danger ? '#cc5555' : '#bbbbbb');
      }}
      onMouseLeave={e => {
        if (disabled) return;
        const el = e.currentTarget as HTMLElement;
        el.style.background  = voted ? activeBg  : 'transparent';
        el.style.borderColor = voted ? activeBorder : idleBorder;
        el.style.color       = voted ? activeColor  : idleColor;
      }}
    >
      {voted ? votedLabel : label}
    </button>
  );
}

export interface ProposalCardProps {
  id: number;
  title: string;
  description: string;
  status: string;
  ends: string;
  yes: number;
  no: number;
  index: number;
  myVote: 'yes' | 'no' | undefined;
  connected: boolean;
  onVote: (id: number, choice: 'yes' | 'no') => void;
}

export default function ProposalCard({
  id, title, description, status, ends,
  yes, no, index, myVote, connected, onVote,
}: ProposalCardProps) {
  const total    = yes + no;
  const yesPct   = total > 0 ? Math.round((yes / total) * 100) : 0;
  const noPct    = 100 - yesPct;
  const isActive = status === 'Active';

  return (
    <div style={{
      border: '1px solid #252525',
      background: '#111111',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#363636'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#252525'; }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 18px', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d',
      }}>
        <span style={{ fontSize: 10, color: '#404040', letterSpacing: '0.16em', userSelect: 'none' }}>
          ── PROPOSAL_{String(index + 1).padStart(3, '0')} {'─'.repeat(20)}
        </span>
        <span style={{
          fontSize: 10, letterSpacing: '0.14em', padding: '3px 10px',
          border: `1px solid ${isActive ? '#404040' : '#262626'}`,
          color: isActive ? '#888888' : '#444444',
          userSelect: 'none',
        }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div style={{ padding: '22px 24px' }}>
        {/* Title */}
        <h3 style={{
          color: '#e0e0e0', fontSize: 15, fontWeight: 'bold',
          marginBottom: 8, lineHeight: 1.45, letterSpacing: '0.02em',
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{ color: '#777777', fontSize: 13, marginBottom: 22, lineHeight: 1.75 }}>
          // {description}
        </p>

        {/* Progress block */}
        <div style={{
          border: '1px solid #1e1e1e', background: '#0d0d0d',
          padding: '14px 18px', marginBottom: 18,
        }}>
          <div style={{ marginBottom: 10 }}>
            <BlockBar pct={yesPct} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#aaaaaa' }}>
              YES&nbsp; {yesPct}%
              <span style={{ color: '#555555', marginLeft: 8 }}>({yes.toLocaleString()} votes)</span>
            </span>
            <span style={{ color: '#aa5555' }}>
              NO&nbsp; {noPct}%
              <span style={{ color: '#555555', marginLeft: 8 }}>({no.toLocaleString()} votes)</span>
            </span>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#383838', letterSpacing: '0.08em' }}>
            CLOSES: {ends}  ·  TOTAL: {total.toLocaleString()} votes
          </div>
        </div>

        {/* Vote buttons */}
        {isActive && (
          <div style={{ display: 'flex', gap: 12 }}>
            <VoteBtn
              label='[ Vote Yes ]' votedLabel='✓  Voted Yes'
              voted={myVote === 'yes'}
              disabled={!connected || !!myVote}
              onClick={() => onVote(id, 'yes')}
            />
            <VoteBtn
              label='[ Vote No ]' votedLabel='✓  Voted No'
              voted={myVote === 'no'}
              danger
              disabled={!connected || !!myVote}
              onClick={() => onVote(id, 'no')}
            />
          </div>
        )}

        {!connected && isActive && (
          <div style={{ fontSize: 12, color: '#555555', marginTop: 12, letterSpacing: '0.06em' }}>
            // connect wallet to cast your vote
          </div>
        )}
      </div>
    </div>
  );
}
