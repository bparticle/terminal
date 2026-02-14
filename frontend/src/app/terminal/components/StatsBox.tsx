'use client';

import { useState, useEffect } from 'react';
import { getCampaigns, getUserProgress, Campaign, CampaignProgress } from '@/lib/campaign-api';
import { useAuth } from '@/context/AuthProvider';

interface StatsBoxProps {
  walletAddress: string | null;
}

export default function StatsBox({ walletAddress }: StatsBoxProps) {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);

  // Fetch campaigns and progress
  useEffect(() => {
    getCampaigns().then(setCampaigns).catch(console.error);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getUserProgress().then(setProgress).catch(console.error);
    }
  }, [isAuthenticated]);

  // Refresh progress periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      getUserProgress().then(setProgress).catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Refresh immediately when the game engine saves (achievements may have changed)
  useEffect(() => {
    const handleProgressUpdate = () => {
      getCampaigns().then(setCampaigns).catch(console.error);
      if (isAuthenticated) {
        getUserProgress().then(setProgress).catch(console.error);
      }
    };

    window.addEventListener('game-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('game-progress-updated', handleProgressUpdate);
  }, [isAuthenticated]);

  const campaign = campaigns[0]; // Single campaign
  const achievedStates = new Set(
    progress?.achievements.map((a) => a.state_name) || []
  );
  const campaignWon = progress?.campaign_wins.some(
    (w) => w.campaign_id === campaign?.id
  );

  return (
    <div className="panel-box stats-box">
      <div className="panel-title">Campaign</div>

      {!campaign ? (
        <div className="stats-empty">No active campaigns</div>
      ) : (
        <div className="campaign-info">
          <div className="campaign-name">{campaign.name}</div>
          <div className="campaign-desc">{campaign.description}</div>

          {/* Progress dots */}
          <div className="campaign-progress">
            {campaign.target_states.map((state, i) => {
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

          {/* Winner slots */}
          {campaign.max_winners > 0 && (
            <div className="campaign-slots">
              <span className="slots-label">Slots:</span>
              <span className="slots-count">
                {campaign.winner_count || 0}/{campaign.max_winners}
              </span>
            </div>
          )}

          {campaignWon && (
            <div className="campaign-complete">COMPLETED</div>
          )}

          {/* Reward */}
          <div className="campaign-reward">
            <span className="reward-label">Reward:</span>
            <span className="reward-text">{campaign.reward_description}</span>
          </div>
        </div>
      )}

      {/* Wallet info */}
      {walletAddress && (
        <div className="wallet-info">
          <div className="wallet-label">Wallet</div>
          <div className="wallet-addr">
            {walletAddress.substring(0, 4)}...{walletAddress.substring(walletAddress.length - 4)}
          </div>
        </div>
      )}
    </div>
  );
}
