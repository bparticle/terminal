'use client';

import { useMemo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { AuthProvider } from '@/context/AuthProvider';
import ComingSoon from '@/app/coming-soon';

require('@solana/wallet-adapter-react-ui/styles.css');

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  const endpoint = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/rpc`;
    }
    // Fallback for SSR - must be a valid URL
    return 'https://api.mainnet-beta.solana.com';
  }, []);

  const wallets = useMemo(() => [new SolflareWalletAdapter()], []);

  useEffect(() => {
    fetch('/api/proxy/site/status')
      .then((res) => res.json())
      .then((data) => {
        setMaintenance(data.maintenance || false);
        setMaintenanceMessage(data.message || 'COMING SOON');
      })
      .catch(() => {
        // If the check fails, allow access
        setMaintenance(false);
      })
      .finally(() => setMaintenanceChecked(true));
  }, []);

  const isAdminRoute = pathname?.startsWith('/admin');

  // Block rendering until maintenance check completes (except admin routes)
  if (!maintenanceChecked && !isAdminRoute) {
    return <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0a0a0a' }} />;
  }

  if (maintenance && !isAdminRoute) {
    return <ComingSoon message={maintenanceMessage} />;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
