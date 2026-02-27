'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import {
  confirmNftTransfer,
  getGlobalPfpOwners,
  getWalletGallery,
  prepareNftTransfer,
  type GalleryCollection,
  type GlobalPfpOwner,
} from '@/lib/gallery-api';
import { updateProfilePfp } from '@/lib/api';
import type { SignAndSubmitFn } from '@/lib/game-engine';

interface GalleryOverlayProps {
  isOpen: boolean;
  walletAddress: string | null;
  signAndSubmit: SignAndSubmitFn;
  onClose: () => void;
}

const GLOBAL_PFPS_TAB_ID = 'global-pfps';

export default function GalleryOverlay({ isOpen, walletAddress, signAndSubmit, onClose }: GalleryOverlayProps) {
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [currentPfpAssetId, setCurrentPfpAssetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [globalPfps, setGlobalPfps] = useState<GlobalPfpOwner[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedGlobalAssetId, setSelectedGlobalAssetId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [lastTransferSignature, setLastTransferSignature] = useState<string | null>(null);
  const [isSettingPfp, setIsSettingPfp] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const BOOT_MIN_DURATION_MS = 1400;

  const explorerTxUrl = useMemo(() => {
    if (!lastTransferSignature) return null;
    const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '';
    const cluster = rpc.includes('devnet') ? 'devnet-alpha' : 'mainnet-alpha';
    return `https://solana.fm/tx/${lastTransferSignature}?cluster=${cluster}`;
  }, [lastTransferSignature]);

  const loadGallery = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getWalletGallery(walletAddress);
      setCollections(data.collections || []);
      setCurrentPfpAssetId(data.currentPfpAssetId || null);

      const firstWithItems = (data.collections || []).find((c) => c.nfts.length > 0);
      const firstCollection = firstWithItems || data.collections[0] || null;
      setActiveCollectionId(firstCollection?.collectionId || null);
      setSelectedAssetId(firstCollection?.nfts[0]?.assetId || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  const loadGlobalPfps = useCallback(async () => {
    setGlobalLoading(true);
    setGlobalError(null);
    try {
      const owners = await getGlobalPfpOwners();
      setGlobalPfps(owners);
      setSelectedGlobalAssetId((prev) => prev || owners[0]?.assetId || null);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to load global PFP list');
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsBooting(false);
      setLoading(true);
      setError(null);
      setGlobalError(null);
      return;
    }

    setIsBooting(true);
    let cancelled = false;
    const bootDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, BOOT_MIN_DURATION_MS);
    });

    void Promise.allSettled([bootDelay, loadGallery()]).then(() => {
      if (!cancelled) setIsBooting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, loadGallery]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeCollection = useMemo(
    () => collections.find((collection) => collection.collectionId === activeCollectionId) || null,
    [collections, activeCollectionId],
  );
  const isGlobalPfpsTab = activeCollectionId === GLOBAL_PFPS_TAB_ID;

  const isSoulboundCollection = useMemo(() => {
    if (!activeCollection) return false;
    if (activeCollection.type === 'items') return true;
    return activeCollection.nfts.some((nft) => nft.isSoulbound);
  }, [activeCollection]);

  const selectedNft = useMemo(() => {
    if (!activeCollection || !selectedAssetId) return null;
    return activeCollection.nfts.find((nft) => nft.assetId === selectedAssetId) || null;
  }, [activeCollection, selectedAssetId]);

  const selectedGlobalPfp = useMemo(() => {
    if (!selectedGlobalAssetId) return null;
    return globalPfps.find((pfp) => pfp.assetId === selectedGlobalAssetId) || null;
  }, [globalPfps, selectedGlobalAssetId]);

  const filteredGlobalPfps = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    if (!query) return globalPfps;
    return globalPfps.filter((pfp) => {
      const ownerName = (pfp.ownerName || '').toLowerCase();
      const pfpName = (pfp.pfpName || '').toLowerCase();
      const ownerWallet = pfp.ownerWallet.toLowerCase();
      return ownerName.includes(query) || pfpName.includes(query) || ownerWallet.includes(query);
    });
  }, [globalPfps, globalSearch]);

  useEffect(() => {
    if (!isGlobalPfpsTab) return;
    if (filteredGlobalPfps.length === 0) {
      setSelectedGlobalAssetId(null);
      return;
    }
    const stillExists = filteredGlobalPfps.some((pfp) => pfp.assetId === selectedGlobalAssetId);
    if (!stillExists) {
      setSelectedGlobalAssetId(filteredGlobalPfps[0].assetId);
    }
  }, [isGlobalPfpsTab, filteredGlobalPfps, selectedGlobalAssetId]);

  const setCollection = useCallback((collectionId: string) => {
    if (collectionId === GLOBAL_PFPS_TAB_ID) {
      setActiveCollectionId(collectionId);
      setSelectedAssetId(null);
      setGlobalSearch('');
      setRecipientWallet('');
      setRecipientError(null);
      setTransferError(null);
      setLastTransferSignature(null);
      if (globalPfps.length === 0) {
        void loadGlobalPfps();
      }
      return;
    }

    setActiveCollectionId(collectionId);
    const collection = collections.find((item) => item.collectionId === collectionId);
    setSelectedAssetId(collection?.nfts[0]?.assetId || null);
    setRecipientWallet('');
    setRecipientError(null);
    setTransferError(null);
    setLastTransferSignature(null);
  }, [collections, globalPfps.length, loadGlobalPfps]);

  const validateRecipient = useCallback((address: string): boolean => {
    const trimmed = address.trim();
    if (!trimmed) {
      setRecipientError('Enter a recipient wallet address');
      return false;
    }
    try {
      new PublicKey(trimmed);
    } catch {
      setRecipientError('Invalid Solana wallet address');
      return false;
    }
    if (walletAddress && trimmed === walletAddress) {
      setRecipientError('Cannot transfer to your own wallet');
      return false;
    }
    setRecipientError(null);
    return true;
  }, [walletAddress]);

  const handleSetAsPfp = useCallback(async () => {
    if (!selectedNft) return;
    setIsSettingPfp(true);
    setTransferError(null);
    try {
      await updateProfilePfp(selectedNft.image, selectedNft.assetId);
      setCurrentPfpAssetId(selectedNft.assetId);
      window.dispatchEvent(new CustomEvent('display-image', { detail: { imageUrl: selectedNft.image } }));
    } catch {
      setTransferError('Failed to set this NFT as active PFP');
    } finally {
      setIsSettingPfp(false);
    }
  }, [selectedNft]);

  const handleTransfer = useCallback(async () => {
    if (!selectedNft) return;
    if (!validateRecipient(recipientWallet)) return;

    setIsTransferring(true);
    setTransferError(null);
    setLastTransferSignature(null);

    try {
      const prepared = await prepareNftTransfer(selectedNft.assetId, recipientWallet.trim());
      const signedTransactionBase64 = await signAndSubmit(prepared.transactionBase64);
      const confirmed = await confirmNftTransfer(selectedNft.assetId, prepared.transferToken, signedTransactionBase64);
      setLastTransferSignature(confirmed.signature);
      setSelectedAssetId(null);
      setRecipientWallet('');
      await loadGallery();
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  }, [selectedNft, validateRecipient, recipientWallet, signAndSubmit, loadGallery]);

  if (!isOpen) return null;

  return (
    <div className="gallery-overlay-backdrop" onClick={onClose}>
      <div className="gallery-overlay-panel" onClick={(event) => event.stopPropagation()}>
        <div className={`gallery-overlay-body ${isBooting ? 'is-booting' : 'is-live'}`}>
          <div className={`gallery-crt-boot ${isBooting ? 'crt-visible' : 'crt-hidden'}`} aria-hidden={!isBooting}>
            <div className="gallery-crt-glow" />
            <div className="gallery-crt-text">
              <div className="gallery-boot-line text-green-400">[CRT] POWERING DISPLAY...</div>
              <div className="gallery-boot-line text-cyan-400">[SYS] LOADING MEMORY BANKS...</div>
              <div className="gallery-boot-line text-gray-400">Please stand by.</div>
            </div>
          </div>

          <div className={`gallery-live-content ${isBooting ? 'live-hidden' : 'live-visible'}`}>
            <div className="gallery-live-main">
              {!walletAddress ? (
                <div className="gallery-state-line text-yellow-400">Connect your wallet to open the gallery.</div>
              ) : loading ? (
                <div className="gallery-state-line text-cyan-400">Loading your collection data...</div>
              ) : error ? (
                <div className="gallery-state-wrap">
                  <div className="gallery-state-line text-red-400">{error}</div>
                  <button type="button" className="gallery-action-btn" onClick={() => void loadGallery()}>
                    RETRY
                  </button>
                </div>
              ) : (
                <div className="gallery-layout">
                  <div className="gallery-collection-column">
                    <div className="gallery-section-label">Collections</div>
                    <div className="gallery-tabs">
                      {collections.map((collection) => (
                        <button
                          key={collection.collectionId}
                          type="button"
                          className={`gallery-tab ${activeCollectionId === collection.collectionId ? 'active' : ''}`}
                          onClick={() => setCollection(collection.collectionId)}
                        >
                          {collection.label}
                          <span className="gallery-tab-count">{collection.nfts.length}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`gallery-tab ${isGlobalPfpsTab ? 'active' : ''}`}
                        onClick={() => setCollection(GLOBAL_PFPS_TAB_ID)}
                      >
                        Global PFPs
                        <span className="gallery-tab-count">{filteredGlobalPfps.length}</span>
                      </button>
                    </div>

                    <div className="gallery-section-label">
                      {isGlobalPfpsTab ? 'Global PFP Registry' : isSoulboundCollection ? 'Soulbound Items' : 'Assets'}
                    </div>
                    {isGlobalPfpsTab ? (
                      <div className="gallery-global-search-wrap">
                        <input
                          type="text"
                          className="gallery-transfer-input gallery-global-search-input"
                          placeholder="Search by owner, wallet, or PFP name"
                          value={globalSearch}
                          onChange={(event) => setGlobalSearch(event.target.value)}
                        />
                      </div>
                    ) : null}
                    {isGlobalPfpsTab ? (
                      <div className="gallery-assets-grid">
                        {globalLoading && <div className="gallery-empty">Loading global PFP registry...</div>}
                        {!globalLoading && globalError && <div className="gallery-empty text-red-400">{globalError}</div>}
                        {!globalLoading && !globalError && filteredGlobalPfps.length === 0 && (
                          <div className="gallery-empty">No confirmed PFP mints found yet.</div>
                        )}
                        {!globalLoading && !globalError && filteredGlobalPfps.map((pfp) => {
                          const selected = selectedGlobalAssetId === pfp.assetId;
                          return (
                            <button
                              key={pfp.assetId}
                              type="button"
                              className={`gallery-asset-card gallery-global-pfp-card ${selected ? 'selected' : ''}`}
                              onClick={() => setSelectedGlobalAssetId(pfp.assetId)}
                            >
                              {pfp.image ? (
                                <img src={pfp.image} alt={pfp.pfpName} className="gallery-asset-image" />
                              ) : (
                                <div className="gallery-global-pfp-image-fallback">NO IMAGE</div>
                              )}
                              <div className="gallery-asset-name">{pfp.pfpName || 'Scanlines PFP'}</div>
                              <div className="gallery-global-pfp-owner">
                                {pfp.ownerName || `${pfp.ownerWallet.slice(0, 6)}...${pfp.ownerWallet.slice(-4)}`}
                              </div>
                              <div className="gallery-global-pfp-meta">
                                {pfp.ownerWallet.slice(0, 8)}...{pfp.ownerWallet.slice(-8)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={isSoulboundCollection ? 'gallery-assets-list' : 'gallery-assets-grid'}>
                        {(activeCollection?.nfts || []).map((nft) => {
                        const selected = selectedAssetId === nft.assetId;
                        const isCurrentPfp = currentPfpAssetId === nft.assetId;

                        if (isSoulboundCollection) {
                          return (
                            <button
                              key={nft.assetId}
                              type="button"
                              className={`gallery-asset-row ${selected ? 'selected' : ''}`}
                              onClick={() => setSelectedAssetId(nft.assetId)}
                            >
                              <div className="gallery-asset-row-main">
                                <div className="gallery-asset-name">{nft.name || 'Unnamed item'}</div>
                                <div className="gallery-asset-row-id">
                                  {nft.assetId.slice(0, 10)}...{nft.assetId.slice(-10)}
                                </div>
                              </div>
                              <div className="gallery-asset-row-tags">
                                <span className="gallery-soulbound-chip">SOULBOUND</span>
                                {isCurrentPfp && <span className="gallery-badge">ACTIVE PFP</span>}
                              </div>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={nft.assetId}
                            type="button"
                            className={`gallery-asset-card ${selected ? 'selected' : ''}`}
                            onClick={() => setSelectedAssetId(nft.assetId)}
                          >
                            <img src={nft.image || ''} alt={nft.name} className="gallery-asset-image" />
                            <div className="gallery-asset-name">{nft.name || 'Unnamed NFT'}</div>
                            {isCurrentPfp && <div className="gallery-badge">ACTIVE PFP</div>}
                          </button>
                        );
                        })}
                        {activeCollection && activeCollection.nfts.length === 0 && (
                          <div className="gallery-empty">No assets in this collection.</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="gallery-detail-column">
                    <div className="gallery-detail-actions">
                      <button
                        type="button"
                        className="gallery-action-btn"
                        onClick={() => void (isGlobalPfpsTab ? loadGlobalPfps() : loadGallery())}
                        disabled={isGlobalPfpsTab ? globalLoading : loading}
                      >
                        REFRESH
                      </button>
                    </div>
                    {isGlobalPfpsTab ? (
                      selectedGlobalPfp ? (
                        <>
                          <div className="gallery-detail-top gallery-detail-top-list">
                            <div className="gallery-detail-meta">
                              {selectedGlobalPfp.image ? (
                                <img src={selectedGlobalPfp.image} alt={selectedGlobalPfp.pfpName} className="gallery-global-pfp-image" />
                              ) : (
                                <div className="gallery-state-line text-gray-400">Image preview unavailable.</div>
                              )}
                              <div className="gallery-detail-name">{selectedGlobalPfp.pfpName}</div>
                              <div className="gallery-detail-assetid">
                                {selectedGlobalPfp.assetId.slice(0, 12)}...{selectedGlobalPfp.assetId.slice(-12)}
                              </div>
                            </div>
                          </div>
                          <div className="gallery-section-label">Owner</div>
                          <div className="gallery-traits-list">
                            <div className="gallery-trait-row">
                              <span className="gallery-trait-type">Name</span>
                              <span className="gallery-trait-value">{selectedGlobalPfp.ownerName || 'Unknown'}</span>
                            </div>
                            <div className="gallery-trait-row">
                              <span className="gallery-trait-type">Wallet</span>
                              <span className="gallery-trait-value">{selectedGlobalPfp.ownerWallet}</span>
                            </div>
                            <div className="gallery-trait-row">
                              <span className="gallery-trait-type">Minted</span>
                              <span className="gallery-trait-value">{new Date(selectedGlobalPfp.mintedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="gallery-empty">Select a global PFP entry to view owner details.</div>
                      )
                    ) : selectedNft ? (
                      <>
                        <div className={`gallery-detail-top ${isSoulboundCollection ? 'gallery-detail-top-list' : ''}`}>
                          {!isSoulboundCollection && (
                            <img src={selectedNft.image || ''} alt={selectedNft.name} className="gallery-detail-image" />
                          )}
                          <div className="gallery-detail-meta">
                            <div className="gallery-detail-name">{selectedNft.name}</div>
                            <div className="gallery-detail-assetid">
                              {selectedNft.assetId.slice(0, 12)}...{selectedNft.assetId.slice(-12)}
                            </div>
                            {isSoulboundCollection && (
                              <div className="gallery-state-line text-gray-400">Image preview unavailable for this soulbound item.</div>
                            )}
                            {currentPfpAssetId === selectedNft.assetId ? (
                              <div className="gallery-state-line text-green-400">This NFT is your active PFP.</div>
                            ) : (
                              <button
                                type="button"
                                className="gallery-action-btn"
                                onClick={() => void handleSetAsPfp()}
                                disabled={isSettingPfp || isSoulboundCollection}
                              >
                                {isSettingPfp ? 'SETTING PFP...' : 'SET AS PFP'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="gallery-section-label">Traits</div>
                        <div className="gallery-traits-list">
                          {selectedNft.attributes.length === 0 && (
                            <div className="gallery-empty">No traits available for this NFT.</div>
                          )}
                          {selectedNft.attributes.map((attr, idx) => (
                            <div key={`${attr.trait_type}-${idx}`} className="gallery-trait-row">
                              <span className="gallery-trait-type">{attr.trait_type}</span>
                              <span className="gallery-trait-value">{String(attr.value)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="gallery-section-label">Transfer</div>
                        {selectedNft.isSoulbound ? (
                          <div className="gallery-state-line text-yellow-400">
                            This NFT is soulbound and cannot be transferred.
                          </div>
                        ) : (
                          <div className="gallery-transfer-box">
                            <input
                              type="text"
                              className="gallery-transfer-input"
                              value={recipientWallet}
                              onChange={(event) => {
                                setRecipientWallet(event.target.value);
                                if (event.target.value) validateRecipient(event.target.value);
                                else setRecipientError(null);
                              }}
                              placeholder="Recipient Solana wallet"
                            />
                            {recipientError && <div className="gallery-state-line text-red-400">{recipientError}</div>}
                            {transferError && <div className="gallery-state-line text-red-400">{transferError}</div>}
                            {lastTransferSignature && (
                              <div className="gallery-success-wrap">
                                <div className="gallery-state-line text-green-400">
                                  Transfer submitted: {lastTransferSignature.slice(0, 16)}...{lastTransferSignature.slice(-16)}
                                </div>
                                {explorerTxUrl && (
                                  <a href={explorerTxUrl} target="_blank" rel="noopener noreferrer" className="gallery-explorer-link">
                                    VIEW TRANSACTION
                                  </a>
                                )}
                              </div>
                            )}
                            <button
                              type="button"
                              className="gallery-action-btn"
                              onClick={() => void handleTransfer()}
                              disabled={isTransferring || !recipientWallet || !!recipientError}
                            >
                              {isTransferring ? 'CONFIRMING TRANSFER...' : 'TRANSFER NFT'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="gallery-empty">Select an NFT to see details and transfer options.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="gallery-monitor-controls">
          <div className="gallery-monitor-brand" aria-hidden>
            SCANLINES CRT-9
          </div>
          <button
            type="button"
            className="gallery-monitor-close"
            onClick={onClose}
            aria-label="Power off gallery"
            title="Power off"
          >
            <span aria-hidden>⏻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
