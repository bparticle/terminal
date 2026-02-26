'use client';

import { useState, useEffect } from 'react';
import {
  getAllCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  evaluateCampaign,
  simulateAchievement,
  getCampaignLeaderboard,
  type Campaign,
  type CreateCampaignInput,
  type CampaignLeaderboardEntry,
} from '@/lib/campaign-api';
import { getGameMetadata, resyncAchievements } from '@/lib/admin-api';

type ModalType = 'create' | 'edit' | 'leaderboard' | 'simulate' | null;

const emptyCampaignForm: CreateCampaignInput = {
  name: '',
  description: '',
  target_states: [],
  target_value: 'true',
  require_all: true,
  sets_state: '',
  max_winners: 0,
  reward_description: '',
  reward_nft_mint: '',
  is_active: true,
  expires_at: '',
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CreateCampaignInput>(emptyCampaignForm);
  const [targetStateInput, setTargetStateInput] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<{
    campaign: Campaign | null;
    leaderboard: CampaignLeaderboardEntry[];
  } | null>(null);
  const [simulateForm, setSimulateForm] = useState({
    wallet_address: '',
    state_name: '',
    state_value: 'true',
  });
  const [gameStates, setGameStates] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadGameStates();
  }, []);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      showStatus('error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadGameStates = async () => {
    try {
      const metadata = await getGameMetadata();
      setGameStates(metadata.all_states || []);
    } catch (error) {
      console.error('Error loading game states:', error);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
  };

  // --- Campaign CRUD ---

  const handleCreate = () => {
    setFormData({ ...emptyCampaignForm });
    setTargetStateInput('');
    setActiveModal('create');
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      target_states: [...campaign.target_states],
      target_value: campaign.target_value,
      require_all: campaign.require_all,
      sets_state: campaign.sets_state || '',
      max_winners: campaign.max_winners,
      reward_description: campaign.reward_description,
      reward_nft_mint: campaign.reward_nft_mint || '',
      is_active: campaign.is_active,
      expires_at: campaign.expires_at ? campaign.expires_at.split('T')[0] : '',
    });
    setTargetStateInput('');
    setActiveModal('edit');
  };

  const handleSave = async () => {
    if (!formData.name || !formData.reward_description || formData.target_states.length === 0) {
      showStatus('error', 'Name, reward description, and at least one target state are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at || undefined,
        sets_state: formData.sets_state || undefined,
        reward_nft_mint: formData.reward_nft_mint || undefined,
        description: formData.description || undefined,
      };

      if (activeModal === 'create') {
        await createCampaign(payload);
        showStatus('success', 'Campaign created successfully');
      } else if (activeModal === 'edit' && selectedCampaign) {
        await updateCampaign(selectedCampaign.id, payload);
        showStatus('success', 'Campaign updated successfully');
      }

      setActiveModal(null);
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;

    try {
      await deleteCampaign(campaign.id);
      showStatus('success', 'Campaign deleted');
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to delete campaign');
    }
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await updateCampaign(campaign.id, { is_active: !campaign.is_active });
      showStatus('success', `Campaign ${campaign.is_active ? 'deactivated' : 'activated'}`);
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to toggle campaign');
    }
  };

  // --- Evaluate ---

  const handleEvaluate = async (campaign: Campaign) => {
    if (!confirm(`Evaluate campaign "${campaign.name}"?\nThis will retroactively award wins to all qualifying users.`)) return;

    try {
      const result = await evaluateCampaign(campaign.id);
      const msg = `Scanned ${result.users_scanned} user(s) — ${result.users_qualified} qualified — ${result.winners_awarded} new win(s) awarded.`;
      showStatus(result.winners_awarded > 0 ? 'success' : 'success', msg);
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to evaluate campaign');
    }
  };

  // --- Resync achievements ---

  const handleResync = async () => {
    if (!confirm('Re-scan all game saves and backfill missing achievement records?\n\nThis is read-safe and idempotent — existing data is never modified.')) return;

    setResyncing(true);
    try {
      const result = await resyncAchievements();
      showStatus('success', `Resync complete — ${result.users_processed} save(s) scanned, ${result.achievements_added} new achievement row(s) written.`);
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to resync achievements');
    } finally {
      setResyncing(false);
    }
  };

  // --- Leaderboard ---

  const handleViewLeaderboard = async (campaign: Campaign) => {
    try {
      const data = await getCampaignLeaderboard(campaign.id);
      setLeaderboardData(data);
      setSelectedCampaign(campaign);
      setActiveModal('leaderboard');
    } catch (error) {
      showStatus('error', 'Failed to load leaderboard');
    }
  };

  const exportLeaderboardCSV = () => {
    if (!leaderboardData) return;
    const rows = [
      ['Rank', 'Wallet', 'Name', 'Achieved At'],
      ...leaderboardData.leaderboard.map((e) => [
        String(e.rank),
        e.wallet_address,
        e.name || '',
        new Date(e.achieved_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${selectedCampaign?.name || 'campaign'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Simulate ---

  const handleSimulate = async () => {
    if (!simulateForm.wallet_address || !simulateForm.state_name) {
      showStatus('error', 'Wallet address and state name are required');
      return;
    }

    setSaving(true);
    try {
      await simulateAchievement(simulateForm);
      showStatus('success', 'Achievement simulated successfully');
      setActiveModal(null);
      loadCampaigns();
    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : 'Failed to simulate achievement');
    } finally {
      setSaving(false);
    }
  };

  // --- Target state helpers ---

  const addTargetState = (state: string) => {
    const trimmed = state.trim();
    if (trimmed && !formData.target_states.includes(trimmed)) {
      setFormData({ ...formData, target_states: [...formData.target_states, trimmed] });
    }
    setTargetStateInput('');
  };

  const removeTargetState = (state: string) => {
    setFormData({
      ...formData,
      target_states: formData.target_states.filter((s) => s !== state),
    });
  };

  // --- Campaign status helper ---

  const getCampaignStatus = (campaign: Campaign): { label: string; color: string } => {
    if (!campaign.is_active) return { label: 'INACTIVE', color: 'text-gray-400 bg-gray-800' };
    if (campaign.expires_at && new Date(campaign.expires_at) < new Date())
      return { label: 'EXPIRED', color: 'text-yellow-400 bg-yellow-900/30' };
    if (campaign.is_full) return { label: 'FULL', color: 'text-orange-400 bg-orange-900/30' };
    return { label: 'ACTIVE', color: 'text-green-400 bg-green-900/30' };
  };

  // --- Render ---

  if (loading) {
    return <div className="text-green-400 animate-pulse p-4">Loading campaigns...</div>;
  }

  return (
    <div>
      {/* Status message */}
      {statusMessage && (
        <div
          className={`mb-4 px-4 py-2 border text-sm ${
            statusMessage.type === 'success'
              ? 'border-green-700 bg-green-900/30 text-green-400'
              : 'border-red-700 bg-red-900/30 text-red-400'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm bg-green-800 text-green-100 border border-green-600 hover:bg-green-700 transition-colors"
        >
          + CREATE CAMPAIGN
        </button>
        <button
          onClick={() => {
            setSimulateForm({ wallet_address: '', state_name: '', state_value: 'true' });
            setActiveModal('simulate');
          }}
          className="px-4 py-2 text-sm bg-blue-800 text-blue-100 border border-blue-600 hover:bg-blue-700 transition-colors"
        >
          SIMULATE ACHIEVEMENT
        </button>
        <button
          onClick={handleResync}
          disabled={resyncing}
          className="px-4 py-2 text-sm bg-yellow-900/60 text-yellow-300 border border-yellow-700 hover:bg-yellow-800/60 disabled:opacity-50 transition-colors"
          title="Re-scan all game saves and backfill missing achievement records. Safe to run multiple times."
        >
          {resyncing ? 'RESYNCING...' : 'RESYNC ACHIEVEMENTS'}
        </button>
        <button
          onClick={loadCampaigns}
          className="px-4 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          REFRESH
        </button>
        <span className="text-sm text-gray-500 ml-auto">{campaigns.length} campaign(s)</span>
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="text-gray-500 text-center py-8 border border-gray-800">
            No campaigns found. Create one to get started.
          </div>
        ) : (
          campaigns.map((campaign) => {
            const status = getCampaignStatus(campaign);
            return (
              <div
                key={campaign.id}
                className="border border-gray-800 bg-gray-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg text-green-300 truncate">{campaign.name}</h3>
                      <span className={`text-xs px-2 py-0.5 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-gray-400 mb-2">{campaign.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                      <span>
                        States: {campaign.target_states.join(', ')}{' '}
                        ({campaign.require_all ? 'ALL required' : 'ANY'})
                      </span>
                      <span>
                        Winners: {campaign.winner_count ?? 0}
                        {campaign.max_winners > 0 ? ` / ${campaign.max_winners}` : ' (unlimited)'}
                      </span>
                      <span>Reward: {campaign.reward_description}</span>
                      {campaign.expires_at && (
                        <span>Expires: {new Date(campaign.expires_at).toLocaleDateString()}</span>
                      )}
                      {campaign.sets_state && (
                        <span>Sets: {campaign.sets_state}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewLeaderboard(campaign)}
                      className="px-2 py-1 text-xs bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700"
                      title="View leaderboard"
                    >
                      BOARD
                    </button>
                    <button
                      onClick={() => handleEvaluate(campaign)}
                      className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 border border-purple-700 hover:bg-purple-800/50"
                      title="Evaluate campaign"
                    >
                      EVAL
                    </button>
                    <button
                      onClick={() => handleToggleActive(campaign)}
                      className={`px-2 py-1 text-xs border ${
                        campaign.is_active
                          ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700 hover:bg-yellow-800/30'
                          : 'bg-green-900/30 text-green-300 border-green-700 hover:bg-green-800/30'
                      }`}
                      title={campaign.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {campaign.is_active ? 'DEACT' : 'ACTIV'}
                    </button>
                    <button
                      onClick={() => handleEdit(campaign)}
                      className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 border border-blue-700 hover:bg-blue-800/30"
                      title="Edit campaign"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(campaign)}
                      className="px-2 py-1 text-xs bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-800/30"
                      title="Delete campaign"
                    >
                      DEL
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* === MODALS === */}

      {/* Create/Edit Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <Modal
          title={activeModal === 'create' ? 'CREATE CAMPAIGN' : 'EDIT CAMPAIGN'}
          onClose={() => setActiveModal(null)}
        >
          <div className="space-y-4">
            {/* Name */}
            <Field label="Name *">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="admin-input"
                placeholder="Campaign name"
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="admin-input min-h-[60px]"
                placeholder="Campaign description"
                rows={2}
              />
            </Field>

            {/* Target States */}
            <Field label="Target States *">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={targetStateInput}
                  onChange={(e) => setTargetStateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTargetState(targetStateInput);
                    }
                  }}
                  className="admin-input flex-1"
                  placeholder="Type state name and press Enter"
                  list="game-states-list"
                />
                <button
                  onClick={() => addTargetState(targetStateInput)}
                  className="px-3 py-1 text-sm bg-green-800 text-green-100 border border-green-600 hover:bg-green-700"
                >
                  ADD
                </button>
              </div>
              <datalist id="game-states-list">
                {gameStates.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {formData.target_states.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.target_states.map((state) => (
                    <span
                      key={state}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-900/30 text-green-400 border border-green-800"
                    >
                      {state}
                      <button
                        onClick={() => removeTargetState(state)}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* Target Value + Require All */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Target Value">
                <input
                  type="text"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  className="admin-input"
                  placeholder="true"
                />
              </Field>
              <Field label="Require All States">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData.require_all}
                    onChange={(e) => setFormData({ ...formData, require_all: e.target.checked })}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-300">
                    {formData.require_all ? 'All states required' : 'Any state matches'}
                  </span>
                </label>
              </Field>
            </div>

            {/* Sets State */}
            <Field label="Sets State (on completion)">
              <input
                type="text"
                value={formData.sets_state}
                onChange={(e) => setFormData({ ...formData, sets_state: e.target.value })}
                className="admin-input"
                placeholder="e.g. campaign_my_campaign_complete"
              />
            </Field>

            {/* Max Winners */}
            <Field label="Max Winners (0 = unlimited)">
              <input
                type="number"
                value={formData.max_winners}
                onChange={(e) => setFormData({ ...formData, max_winners: parseInt(e.target.value) || 0 })}
                className="admin-input"
                min={0}
              />
            </Field>

            {/* Reward Description */}
            <Field label="Reward Description *">
              <input
                type="text"
                value={formData.reward_description}
                onChange={(e) => setFormData({ ...formData, reward_description: e.target.value })}
                className="admin-input"
                placeholder="What winners receive"
              />
            </Field>

            {/* Reward NFT Mint */}
            <Field label="Reward NFT Mint (optional)">
              <input
                type="text"
                value={formData.reward_nft_mint}
                onChange={(e) => setFormData({ ...formData, reward_nft_mint: e.target.value })}
                className="admin-input"
                placeholder="Solana mint address"
              />
            </Field>

            {/* Active + Expires */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Active">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-green-500"
                  />
                  <span className="text-sm text-gray-300">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </Field>
              <Field label="Expires At">
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="admin-input"
                />
              </Field>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 text-sm bg-green-800 text-green-100 border border-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'SAVING...' : activeModal === 'create' ? 'CREATE' : 'SAVE CHANGES'}
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Leaderboard Modal */}
      {activeModal === 'leaderboard' && leaderboardData && (
        <Modal
          title={`LEADERBOARD: ${selectedCampaign?.name || ''}`}
          onClose={() => setActiveModal(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">
                {leaderboardData.leaderboard.length} winner(s)
              </span>
              {leaderboardData.leaderboard.length > 0 && (
                <button
                  onClick={exportLeaderboardCSV}
                  className="px-3 py-1 text-xs bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                >
                  EXPORT CSV
                </button>
              )}
            </div>

            {leaderboardData.leaderboard.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No winners yet.</p>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-400 border-b border-gray-800 sticky top-0 bg-gray-900">
                    <tr>
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Wallet</th>
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.leaderboard.map((entry) => (
                      <tr key={entry.rank} className="border-b border-gray-800/50">
                        <td className="py-1.5 px-2 text-green-400">{entry.rank}</td>
                        <td className="py-1.5 px-2 text-gray-300 font-mono text-xs">
                          {entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-4)}
                        </td>
                        <td className="py-1.5 px-2 text-gray-300">{entry.name || '-'}</td>
                        <td className="py-1.5 px-2 text-gray-500">
                          {new Date(entry.achieved_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Simulate Achievement Modal */}
      {activeModal === 'simulate' && (
        <Modal title="SIMULATE ACHIEVEMENT" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <Field label="Wallet Address *">
              <input
                type="text"
                value={simulateForm.wallet_address}
                onChange={(e) => setSimulateForm({ ...simulateForm, wallet_address: e.target.value })}
                className="admin-input"
                placeholder="Solana wallet address"
              />
            </Field>
            <Field label="State Name *">
              <input
                type="text"
                value={simulateForm.state_name}
                onChange={(e) => setSimulateForm({ ...simulateForm, state_name: e.target.value })}
                className="admin-input"
                placeholder="e.g. riddle_solved"
                list="sim-game-states-list"
              />
              <datalist id="sim-game-states-list">
                {gameStates.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="State Value">
              <input
                type="text"
                value={simulateForm.state_value}
                onChange={(e) => setSimulateForm({ ...simulateForm, state_value: e.target.value })}
                className="admin-input"
                placeholder="true"
              />
            </Field>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSimulate}
                disabled={saving}
                className="px-6 py-2 text-sm bg-blue-800 text-blue-100 border border-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'SIMULATING...' : 'SIMULATE'}
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-6 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// --- Utility Components ---

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div
        className="bg-gray-900 border border-green-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
          <h2 className="text-lg text-green-400">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
