'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const WalletProvider = dynamic(
  () => import('./WalletProvider'),
  { ssr: false }
);

export default function WalletWrapper({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
