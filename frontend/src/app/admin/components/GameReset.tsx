'use client';

import { useState } from 'react';
import { resetAllPlayers } from '@/lib/admin-api';

export default function GameReset() {
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [result, setResult] = useState<{ playersReset: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canReset = confirmText === 'RESET';

  const handleResetAll = async () => {
    if (!canReset) return;
    setIsResetting(true);
    setError(null);
    setResult(null);

    try {
      const data = await resetAllPlayers();
      setResult(data);
      setConfirmText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-red-900/50 bg-red-950/20 p-6">
        <h2 className="text-lg text-red-400 mb-2">WORLD RESET</h2>
        <p className="text-sm text-gray-400 mb-4">
          Resets <span className="text-red-300">all players&apos;</span> game saves: current node, game state, and inventory.
          Use this when deploying a new story. Achievements, campaign wins, and player accounts are preserved.
        </p>

        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs text-gray-500 mb-1">
              Type <span className="text-red-400 font-bold">RESET</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="admin-input w-full"
              placeholder="Type RESET..."
              disabled={isResetting}
            />
          </div>
          <button
            onClick={handleResetAll}
            disabled={!canReset || isResetting}
            className={`px-6 py-2 text-sm border transition-colors ${
              canReset && !isResetting
                ? 'bg-red-900/50 text-red-300 border-red-700 hover:bg-red-800/50 cursor-pointer'
                : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
            }`}
          >
            {isResetting ? 'RESETTING...' : 'RESET ALL PLAYERS'}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-3 border border-green-900 bg-green-950/20 text-sm text-green-400">
            World reset complete. {result.playersReset} player save{result.playersReset !== 1 ? 's' : ''} reset.
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 border border-red-800 bg-red-950/30 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      <div className="border border-gray-800 bg-gray-900/30 p-6">
        <h3 className="text-sm text-gray-400 mb-2">What gets reset</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li><span className="text-gray-300">game_saves</span> — node, location, game_state, and inventory reset to defaults</li>
        </ul>
        <h3 className="text-sm text-gray-400 mt-4 mb-2">What is preserved</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li><span className="text-gray-300">achievements</span> — immutable record of earned state flags</li>
          <li><span className="text-gray-300">campaign_winners</span> — permanent leaderboard rankings</li>
          <li><span className="text-gray-300">users</span> — accounts, names, PFPs, and wallet links</li>
        </ul>
      </div>
    </div>
  );
}
