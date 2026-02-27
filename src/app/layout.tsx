import type { Metadata } from 'next';
import WalletWrapper from '@/components/WalletWrapper';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tix-dao.vercel.app'),
  title: {
    default: 'TIX-DAO | Venue Governance on-chain. Ticketing reclaimed.',
    template: '%s | TIX-DAO',
  },
  description: 'TIX-DAO — venue governance on Solana Realms. Resale caps, royalty splits, and refund windows decided by token holders, not Ticketmaster. Built by Orthonode Infrastructure Labs.',
  openGraph: {
    type: 'website',
    url: 'https://tix-dao.vercel.app',
    siteName: 'TIX-DAO',
    title: 'TIX-DAO | Venue Governance on-chain. Ticketing reclaimed.',
    description: 'Venue governance on Solana Realms. Resale caps, royalty splits, and refund windows decided by token holders, not Ticketmaster.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@OrthonodeSys',
    creator: '@OrthonodeSys',
    title: 'TIX-DAO | Venue Governance on-chain.',
    description: 'Venue governance on Solana Realms. Token holders vote on ticketing policy — not Ticketmaster.',
  },
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
