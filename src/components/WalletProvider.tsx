'use client';

import React, { FC, ReactNode, useMemo, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

interface Props { children: ReactNode; }

const SolanaWalletProvider: FC<Props> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [], []);

  // Silently swallow expected wallet errors so the UI never breaks:
  //   – no wallet installed / not ready
  //   – user dismissed the popup or rejected the request
  //   – permission request already in-flight (autoConnect race)
  const onError = useCallback((error: WalletError) => {
    const silentNames = [
      'WalletNotReadyError',
      'WalletNotSelectedError',
      'WalletNotFoundError',
      'WalletConnectionError',
      'WalletDisconnectedError',
    ];
    if (silentNames.includes(error.name)) return;

    const msg = error.message?.toLowerCase() ?? '';
    if (
      msg.includes('user rejected') ||
      msg.includes('user cancelled') ||
      msg.includes('already pending') ||
      msg.includes('no wallet')
    ) return;

    // Only surface truly unexpected errors
    console.warn('[tix-dao wallet]', error.name, error.message);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
