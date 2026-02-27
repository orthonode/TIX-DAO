import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Venue Finance — RWA Advance',
  description: 'Request a venue advance against future ticket revenue. Collateral: ticket RWAs via TICKS protocol. Terms governed and ratified by your DAO on Realms.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
