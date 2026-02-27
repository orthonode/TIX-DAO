import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Proposals',
  description: 'Vote on live governance proposals — resale price caps, artist royalty rates, and refund windows — for your venue DAO on Solana.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
