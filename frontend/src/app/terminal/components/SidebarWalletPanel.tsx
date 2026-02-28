'use client';

interface SidebarWalletPanelProps {
  walletAddress: string | null;
  isWalletConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onChangeWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenCampaign: () => void;
  onOpenGallery: () => void;
  hasLiveCampaigns: boolean;
}

export default function SidebarWalletPanel({
  walletAddress,
  isWalletConnected,
  isAuthenticated,
  isAuthenticating,
  onChangeWallet,
  onDisconnectWallet,
  onOpenCampaign,
  onOpenGallery,
  hasLiveCampaigns,
}: SidebarWalletPanelProps) {
  const walletStatusLabel = walletAddress
    ? `Wallet: ${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`
    : 'Wallet: connect';

  const walletMetaLabel = !isWalletConnected
    ? ''
    : isAuthenticated
      ? ''
      : isAuthenticating
        ? ' (verifying...)'
        : ' (verify)';

  return (
    <div className="panel-box wallet-panel">
      {walletAddress ? (
        <div className="wallet-inline-row">
          <button
            type="button"
            className="wallet-inline-btn wallet-inline-address"
            onClick={onChangeWallet}
            title={
              !isWalletConnected
                ? 'Connect wallet'
                : isAuthenticated
                  ? 'Change wallet'
                  : 'Verify wallet signature'
            }
          >
            {walletStatusLabel}{walletMetaLabel}
          </button>
          <button
            type="button"
            className="wallet-inline-btn wallet-inline-disconnect"
            onClick={onDisconnectWallet}
            title="Disconnect wallet"
          >
            disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="wallet-inline-btn wallet-inline-address"
          onClick={onChangeWallet}
          title="Connect wallet"
        >
          {walletStatusLabel}
        </button>
      )}

      <div className="wallet-action-row">
        <button
          type="button"
          className="wallet-action-btn wallet-action-btn-compact"
          onClick={onOpenCampaign}
          disabled={!isAuthenticated}
          aria-label="Open campaign screen"
        >
          {hasLiveCampaigns && <span className="wallet-live-dot" aria-hidden />}
          Campaign
        </button>
        <button
          type="button"
          className="wallet-action-btn wallet-action-btn-compact"
          onClick={onOpenGallery}
          disabled={!isAuthenticated}
          aria-label="Open gallery"
        >
          Gallery
        </button>
      </div>
    </div>
  );
}
