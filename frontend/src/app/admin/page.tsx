'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@/context/AuthProvider';
import { checkAdminStatus } from '@/lib/admin-api';
import Campaigns from './components/Campaigns';
import GameUserStatus from './components/GameUserStatus';
import GameReset from './components/GameReset';
import SiteSettings from './components/SiteSettings';

type AdminTab = 'campaigns' | 'game-users' | 'game-reset' | 'site-settings';

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const { session, isAuthenticated, isAuthenticating, authenticate } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('campaigns');
  const router = useRouter();

  useEffect(() => {
    if (connected && isAuthenticated && session) {
      verifyAdmin();
    }
  }, [connected, isAuthenticated, session]);

  const verifyAdmin = async () => {
    setCheckingAdmin(true);
    try {
      const adminStatus = await checkAdminStatus();
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Admin check failed:', error);
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Not connected
  if (!connected) {
    return (
      <div className="admin-page min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl text-green-400">ADMIN ACCESS</h1>
        <p className="text-gray-400">Connect your wallet to continue.</p>
        <WalletMultiButton />
      </div>
    );
  }

  // Connected but not authenticated
  if (!isAuthenticated && !isAuthenticating) {
    return (
      <div className="admin-page min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl text-green-400">ADMIN ACCESS</h1>
        <p className="text-gray-400">Please authenticate with your wallet.</p>
        <button
          onClick={() => authenticate()}
          className="px-6 py-2 bg-green-700 text-green-100 border border-green-500 hover:bg-green-600 transition-colors"
        >
          AUTHENTICATE
        </button>
      </div>
    );
  }

  // Authenticating or checking admin
  if (isAuthenticating || checkingAdmin) {
    return (
      <div className="admin-page min-h-screen flex items-center justify-center">
        <p className="text-xl text-green-400 animate-pulse">
          {isAuthenticating ? 'Authenticating...' : 'Verifying admin access...'}
        </p>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="admin-page min-h-screen flex flex-col items-center justify-center gap-6 p-4">
        <h1 className="text-3xl text-red-400">ACCESS DENIED</h1>
        <p className="text-gray-400">
          Wallet {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)} does not have admin privileges.
        </p>
        <button
          onClick={() => router.push('/terminal')}
          className="px-6 py-2 bg-gray-700 text-gray-100 border border-gray-500 hover:bg-gray-600 transition-colors"
        >
          BACK TO TERMINAL
        </button>
      </div>
    );
  }

  // Admin dashboard
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'game-users', label: 'Game Users' },
    { id: 'game-reset', label: 'Game Reset' },
    { id: 'site-settings', label: 'Site Settings' },
  ];

  return (
    <div className="admin-page min-h-screen overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-green-900 pb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl text-green-400">ADMIN PANEL</h1>
            <span className="text-xs text-gray-500">
              {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
            </span>
          </div>
          <button
            onClick={() => router.push('/terminal')}
            className="px-4 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            BACK TO TERMINAL
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm border transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-900/50 text-green-400 border-green-700'
                  : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'campaigns' && <Campaigns />}
          {activeTab === 'game-users' && <GameUserStatus />}
          {activeTab === 'game-reset' && <GameReset />}
          {activeTab === 'site-settings' && <SiteSettings />}
        </div>
      </div>
    </div>
  );
}
