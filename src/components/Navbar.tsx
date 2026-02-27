'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  const path = usePathname();

  return (
    <nav style={{
      background: '#0d0d0d',
      borderBottom: '1px solid #282828',
      fontFamily: "ui-monospace, 'Courier New', monospace",
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {/* Window chrome bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 20px',
        borderBottom: '1px solid #1e1e1e',
        background: '#090909',
      }}>
        <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', display: 'inline-block', opacity: 0.9 }} />
        <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e', display: 'inline-block', opacity: 0.9 }} />
        <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840', display: 'inline-block', opacity: 0.9 }} />
        <span style={{ marginLeft: 20, fontSize: 11, color: '#4a4a4a', letterSpacing: '0.18em', userSelect: 'none' }}>
          TIX-DAO  ·  GOVERNANCE TERMINAL  ·  SOLANA DEVNET  ·  ORTHONODE LABS
        </span>
      </div>

      {/* Main nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>

          {/* Logo */}
          <Link href='/' style={{
            color: '#f2f2f2',
            fontWeight: 'bold',
            fontSize: 16,
            letterSpacing: '0.06em',
            textDecoration: 'none',
            textShadow: '0 0 16px rgba(255,255,255,0.18)',
          }}>
            TIX-DAO<span className='blink' style={{ color: '#aaaaaa' }}>_</span>
          </Link>

          {/* Links */}
          {[
            { href: '/create',    label: './create-dao'    },
            { href: '/proposals', label: './proposals'     },
            { href: '/lock',      label: './lock-tokens'   },
            { href: '/finance',   label: './finance'       },
          ].map(({ href, label }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} style={{
                color: active ? '#e0e0e0' : '#777777',
                fontSize: 13,
                letterSpacing: '0.06em',
                textDecoration: 'none',
                paddingBottom: 3,
                borderBottom: `1px solid ${active ? '#666666' : 'transparent'}`,
                transition: 'color 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => {
                  if (active) return;
                  (e.currentTarget as HTMLElement).style.color = '#b8b8b8';
                }}
                onMouseLeave={e => {
                  if (active) return;
                  (e.currentTarget as HTMLElement).style.color = '#777777';
                }}
              >
                <span style={{ color: '#3e3e3e', userSelect: 'none' }}>$ </span>
                {label}
              </Link>
            );
          })}
        </div>

        <WalletMultiButton />
      </div>
    </nav>
  );
}
