'use client';

import { useState, useEffect, useCallback } from 'react';

interface Player {
  wallet_address: string;
  name: string;
  last_active_at: string;
}

interface PlayersPanelProps {
  currentPlayerName: string | null;
}

export default function PlayersPanel({ currentPlayerName }: PlayersPanelProps) {
  const [players, setPlayers] = useState<Player[]>([]);

  const fetchPlayers = useCallback(async () => {
    try {
      const response = await fetch('/api/proxy/users/online');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players || []);
      }
    } catch {
      // Silently fail - panel just shows empty
    }
  }, []);

  // Poll every 30 seconds
  useEffect(() => {
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 30_000);
    return () => clearInterval(interval);
  }, [fetchPlayers]);

  // Merge current player into the list (always show yourself)
  const displayPlayers = (() => {
    const list = [...players];
    if (currentPlayerName) {
      const alreadyInList = list.some((p) => p.name === currentPlayerName);
      if (!alreadyInList) {
        // Insert self at the top
        list.unshift({
          wallet_address: '_self',
          name: currentPlayerName,
          last_active_at: new Date().toISOString(),
        });
      }
    }
    return list;
  })();

  // Calculate how "fresh" an activity is (for glow intensity)
  const getActivityLevel = (lastActive: string): 'active' | 'recent' | 'idle' => {
    const diff = Date.now() - new Date(lastActive).getTime();
    if (diff < 2 * 60_000) return 'active';   // < 2 min
    if (diff < 4 * 60_000) return 'recent';    // < 4 min
    return 'idle';                              // < 5 min (still in query results)
  };

  return (
    <div className="panel-box players-panel">
      <div className="panel-title">Players Online</div>

      {displayPlayers.length === 0 ? (
        <div className="players-empty">No travelers nearby...</div>
      ) : (
        <div className="players-list">
          {displayPlayers.map((player) => {
            const isYou = player.name === currentPlayerName;
            const activity = isYou ? 'active' : getActivityLevel(player.last_active_at);

            return (
              <div
                key={player.wallet_address}
                className={`player-row ${isYou ? 'player-you' : ''}`}
              >
                <span className={`player-dot dot-${activity}`} />
                <span className="player-name">
                  {player.name}
                  {isYou && <span className="player-you-tag"> (you)</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="players-count">
        {displayPlayers.length} {displayPlayers.length === 1 ? 'traveler' : 'travelers'} online
      </div>
    </div>
  );
}
