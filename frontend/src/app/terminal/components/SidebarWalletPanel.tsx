'use client';

interface SidebarWalletPanelProps {
  walletAddress: string | null;
  isWalletConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  onChangeWallet: () => void;
  onDisconnectWallet: () => void;
  onOpenCampaign: () => void;
}

export default function SidebarWalletPanel({
  walletAddress,
  isWalletConnected,
  isAuthenticated,
  isAuthenticating,
  onChangeWallet,
  onDisconnectWallet,
  onOpenCampaign,
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

      <button
        type="button"
        className="wallet-action-btn"
        onClick={onOpenCampaign}
        disabled={!isAuthenticated}
      >
        OPEN CAMPAIGN SCREEN
      </button>
    </div>
  );
}
