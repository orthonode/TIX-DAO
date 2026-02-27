import type { Metadata } from 'next';
import WalletWrapper from '@/components/WalletWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIX-DAO | Venue Governance on-chain. Ticketing reclaimed.',
  description: 'TIX-DAO — venue governance on Solana Realms. Resale caps, royalty splits, and refund windows decided by token holders, not Ticketmaster. Built by Orthonode Infrastructure Labs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='bg-gray-950 text-white min-h-screen'>
        <WalletWrapper>
          {children}
        </WalletWrapper>
      </body>
    </html>
  );
}
