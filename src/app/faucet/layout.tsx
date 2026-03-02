import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Faucet',
  description: 'Get devnet SOL to pay for TIX-DAO governance transactions.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
