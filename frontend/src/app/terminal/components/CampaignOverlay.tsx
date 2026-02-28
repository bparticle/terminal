'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCampaigns, getUserProgress, type Campaign, type CampaignProgress } from '@/lib/campaign-api';

const BOOT_MIN_DURATION_MS = 1200;

interface CampaignOverlayProps {
  isOpen: boolean;
  walletAddress: string | null;
  currentCampaignId: string | null;
  onSwitchCampaign: (campaignId: string, skinId?: string | null, nodeSetId?: string | null) => void;
  onClose: () => void;
}

function isExpired(campaign: Campaign): boolean {
  if (!campaign.expires_at) return false;
  return new Date(campaign.expires_at).getTime() <= Date.now();
}

export default function CampaignOverlay({ isOpen, walletAddress, currentCampaignId, onSwitchCampaign, onClose }: CampaignOverlayProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [progress, setProgress] = useState<CampaignProgress>({ achievements: [], campaign_wins: [] });
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(false);

  const loadCampaignData = useCallback(async (campaignIdForProgress?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch campaigns and campaign-scoped progress in parallel.
      // Progress is scoped to the selected campaign so dots reflect actual
      // achievements in that campaign, not a merged global view.
      const [campaignRows, progressData] = await Promise.all([
        getCampaigns(),
        walletAddress
          ? getUserProgress(campaignIdForProgress ?? undefined)
          : Promise.resolve({ achievements: [], campaign_wins: [] }),
      ]);
      setCampaigns(campaignRows);
      setProgress(progressData);
      setActiveCampaignId((prev) => prev || currentCampaignId || campaignRows[0]?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [walletAddress, currentCampaignId]);

  // Keep a stable ref so effects always invoke the latest loadCampaignData closure
  // without themselves needing to redeclare it as a dependency.
  const loadCampaignDataRef = useRef(loadCampaignData);
  loadCampaignDataRef.current = loadCampaignData;

  useEffect(() => {
    if (currentCampaignId) {
      setActiveCampaignId(currentCampaignId);
    }
  }, [currentCampaignId]);

  useEffect(() => {
    if (!isOpen) {
      setIsBooting(false);
      setLoading(true);
      setError(null);
      return;
    }

    setIsBooting(true);
    let cancelled = false;
    // Snapshot activeCampaignId at open time. Changes while the overlay is
    // already open are handled by the activeCampaignId effect below.
    const openCampaignId = activeCampaignId;
    const bootDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, BOOT_MIN_DURATION_MS);
    });

    // Use the ref so we always call the latest version of loadCampaignData,
    // even if walletAddress or currentCampaignId changed since this effect
    // was last registered (avoids stale closure over those props).
    void Promise.allSettled([bootDelay, loadCampaignDataRef.current(openCampaignId)]).then(() => {
      if (!cancelled) setIsBooting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps -- activeCampaignId snapshotted intentionally; loadCampaignData via ref

  // Reload campaign-scoped progress whenever the selected campaign changes.
  useEffect(() => {
    if (!isOpen || !activeCampaignId || loading) return;
    getUserProgress(activeCampaignId)
      .then((progressData) => setProgress(progressData))
      .catch(() => {/* silently ignore progress fetch failures */});
  }, [activeCampaignId, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeCampaign = useMemo(() => {
    if (!campaigns.length) return null;
    return campaigns.find((campaign) => campaign.id === activeCampaignId) || campaigns[0];
  }, [campaigns, activeCampaignId]);

  const achievedStates = useMemo(
    () => new Set(progress.achievements.map((a) => a.state_name)),
    [progress.achievements]
  );

  if (!isOpen) return null;

  const renderMain = () => {
    if (!walletAddress) {
      return <div className="gallery-state-line text-yellow-400">Connect your wallet to view campaign progress.</div>;
    }
    if (loading) {
      return <div className="gallery-state-line text-cyan-400">Loading campaign telemetry...</div>;
    }
    if (error) {
      return (
        <div className="gallery-state-wrap">
          <div className="gallery-state-line text-red-400">{error}</div>
          <button type="button" className="gallery-action-btn" onClick={() => void loadCampaignData(activeCampaignId)}>
            RETRY
          </button>
        </div>
      );
    }
    if (!activeCampaign) {
      return <div className="gallery-empty">No active campaigns found.</div>;
    }

    const campaignWon = progress.campaign_wins.some((win) => win.campaign_id === activeCampaign.id);
    const expired = isExpired(activeCampaign);

    return (
      <div className="campaign-overlay-layout">
        <div className="campaign-overlay-column">
          <div className="gallery-section-label">Campaigns</div>
          <div className="campaign-list">
            {campaigns.map((campaign) => {
              const exp = isExpired(campaign);
              return (
                <button
                  key={campaign.id}
                  type="button"
                  className={`campaign-list-btn ${campaign.id === activeCampaign.id ? 'active' : ''} ${exp ? 'opacity-50' : ''}`}
                  onClick={() => setActiveCampaignId(campaign.id)}
                >
                  <span>
                    {campaign.name}
                    {campaign.id === currentCampaignId ? ' [LIVE]' : ''}
                    {exp ? ' [ENDED]' : ''}
                  </span>
                  <span className="campaign-list-btn-count">
                    {campaign.winner_count || 0}/{campaign.max_winners || '∞'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="campaign-overlay-column campaign-overlay-detail">
          <div className="gallery-detail-actions">
            <button type="button" className="gallery-action-btn" onClick={() => void loadCampaignData(activeCampaignId)}>
              REFRESH
            </button>
            <button
              type="button"
              className="gallery-action-btn"
              disabled={activeCampaign.id === currentCampaignId || expired}
              title={expired ? 'This campaign has ended' : undefined}
              onClick={() => onSwitchCampaign(activeCampaign.id, activeCampaign.skin_id || null, activeCampaign.node_set_id || null)}
            >
              {activeCampaign.id === currentCampaignId ? 'ACTIVE' : expired ? 'ENDED' : 'ENTER CAMPAIGN'}
            </button>
          </div>

          <div className="campaign-info">
            <div className="campaign-name">{activeCampaign.name}</div>

            {expired && (
              <div className="campaign-expired text-yellow-400 text-xs mb-1">
                This campaign ended on {new Date(activeCampaign.expires_at!).toLocaleDateString()}.
                Progress is saved but no new winners can be awarded.
              </div>
            )}

            <div className="campaign-desc">{activeCampaign.description}</div>

            <div className="campaign-progress">
              {activeCampaign.target_states.map((state) => {
                const achieved = achievedStates.has(state);
                return (
                  <div
                    key={state}
                    className={`progress-dot ${achieved ? 'achieved' : ''} ${campaignWon ? 'won' : ''}`}
                    title={state.replace(/_/g, ' ')}
                  />
                );
              })}
            </div>

            {activeCampaign.max_winners > 0 && (
              <div className="campaign-slots">
                <span className="slots-label">Slots:</span>
                <span className="slots-count">
                  {activeCampaign.winner_count || 0}/{activeCampaign.max_winners}
                </span>
              </div>
            )}

            {campaignWon && <div className="campaign-complete">COMPLETED</div>}

            {activeCampaign.expires_at && !expired && (
              <div className="campaign-expires text-gray-400 text-xs">
                Ends: {new Date(activeCampaign.expires_at).toLocaleDateString()}
              </div>
            )}

            <div className="campaign-reward">
              <span className="reward-label">Reward:</span>
              <span className="reward-text">{activeCampaign.reward_description}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gallery-overlay-backdrop" onClick={onClose}>
      <div className="gallery-overlay-panel" onClick={(event) => event.stopPropagation()}>
        <div className={`gallery-overlay-body ${isBooting ? 'is-booting' : 'is-live'}`}>
          <div className={`gallery-crt-boot ${isBooting ? 'crt-visible' : 'crt-hidden'}`} aria-hidden={!isBooting}>
            <div className="gallery-crt-glow" />
            <div className="gallery-crt-text">
              <div className="gallery-boot-line text-green-400">[CRT] POWERING CAMPAIGN DISPLAY...</div>
              <div className="gallery-boot-line text-cyan-400">[SYS] READING SIGNALS...</div>
              <div className="gallery-boot-line text-gray-400">Please stand by.</div>
            </div>
          </div>

          <div className={`gallery-live-content ${isBooting ? 'live-hidden' : 'live-visible'}`}>
            <div className="gallery-live-main">
              {renderMain()}
            </div>
          </div>
        </div>

        <div className="gallery-monitor-controls">
          <div className="gallery-monitor-brand" aria-hidden>
            SCANLINES CRT-5
          </div>
          <button
            type="button"
            className="gallery-monitor-close"
            onClick={onClose}
            aria-label="Power off campaign screen"
            title="Power off"
          >
            <span aria-hidden>⏻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
