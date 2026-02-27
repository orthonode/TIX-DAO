import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Create Venue DAO',
  description: 'Deploy a governance Realm for your venue on Solana devnet. Set quorum, configure your $TICK token, and go live in seconds.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
