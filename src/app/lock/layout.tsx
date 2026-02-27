import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Lock Tokens — ve$TICK',
  description: 'Lock $TICK tokens to earn ve$TICK voting power. Longer locks earn higher multipliers — 30 days (1×) up to 365 days (4×). Flash-loan-proof governance.',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
