'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCampaigns, getUserProgress, type Campaign, type CampaignProgress } from '@/lib/campaign-api';

const BOOT_MIN_DURATION_MS = 1200;

interface CampaignOverlayProps {
  isOpen: boolean;
  walletAddress: string | null;
  currentCampaignId: string | null;
  onSwitchCampaign: (campaignId: string, skinId?: string | null) => void;
  onClose: () => void;
}

export default function CampaignOverlay({ isOpen, walletAddress, currentCampaignId, onSwitchCampaign, onClose }: CampaignOverlayProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [progress, setProgress] = useState<CampaignProgress>({ achievements: [], campaign_wins: [] });
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(false);

  const loadCampaignData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignRows, progressData] = await Promise.all([
        getCampaigns(),
        walletAddress ? getUserProgress() : Promise.resolve({ achievements: [], campaign_wins: [] }),
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
    const bootDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, BOOT_MIN_DURATION_MS);
    });

    void Promise.allSettled([bootDelay, loadCampaignData()]).then(() => {
      if (!cancelled) setIsBooting(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, loadCampaignData]);

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
          <button type="button" className="gallery-action-btn" onClick={() => void loadCampaignData()}>
            RETRY
          </button>
        </div>
      );
    }
    if (!activeCampaign) {
      return <div className="gallery-empty">No active campaigns found.</div>;
    }

    const campaignWon = progress.campaign_wins.some((win) => win.campaign_id === activeCampaign.id);

    return (
      <div className="campaign-overlay-layout">
        <div className="campaign-overlay-column">
          <div className="gallery-section-label">Campaigns</div>
          <div className="campaign-list">
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                type="button"
                className={`campaign-list-btn ${campaign.id === activeCampaign.id ? 'active' : ''}`}
                onClick={() => setActiveCampaignId(campaign.id)}
              >
                <span>{campaign.name}{campaign.id === currentCampaignId ? ' [LIVE]' : ''}</span>
                <span className="campaign-list-btn-count">
                  {campaign.winner_count || 0}/{campaign.max_winners || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="campaign-overlay-column campaign-overlay-detail">
          <div className="gallery-detail-actions">
            <button type="button" className="gallery-action-btn" onClick={() => void loadCampaignData()}>
              REFRESH
            </button>
            <button
              type="button"
              className="gallery-action-btn"
              disabled={activeCampaign.id === currentCampaignId}
              onClick={() => onSwitchCampaign(activeCampaign.id, activeCampaign.skin_id || null)}
            >
              {activeCampaign.id === currentCampaignId ? 'ACTIVE' : 'ENTER CAMPAIGN'}
            </button>
          </div>

          <div className="campaign-info">
            <div className="campaign-name">{activeCampaign.name}</div>
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
