'use client';

import { useState, useEffect, useMemo } from 'react';
import { getGameUsers, getGameMetadata, type GameUser, type GameMetadata } from '@/lib/admin-api';

export default function GameUserStatus() {
  const [users, setUsers] = useState<GameUser[]>([]);
  const [metadata, setMetadata] = useState<GameMetadata>({ all_states: [], all_inventory_items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [showStateFilter, setShowStateFilter] = useState(false);
  const [showItemFilter, setShowItemFilter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, metadataData] = await Promise.all([
        getGameUsers(),
        getGameMetadata(),
      ]);
      setUsers(usersData);
      setMetadata(metadataData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // --- Filtering ---

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(q);
        const walletMatch = user.wallet_address.toLowerCase().includes(q);
        if (!nameMatch && !walletMatch) return false;
      }

      // State filters
      if (selectedStates.size > 0 && user.game_state) {
        const userStates = Object.keys(user.game_state);
        const hasAll = [...selectedStates].every((s) => userStates.includes(s));
        if (!hasAll) return false;
      } else if (selectedStates.size > 0) {
        return false;
      }

      // Inventory filters
      if (selectedItems.size > 0 && user.inventory) {
        const hasAll = [...selectedItems].every((item) => user.inventory!.includes(item));
        if (!hasAll) return false;
      } else if (selectedItems.size > 0) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, selectedStates, selectedItems]);

  // Filtered state/item lists for the filter dropdowns
  const filteredStates = useMemo(() => {
    if (!stateSearchQuery) return metadata.all_states;
    const q = stateSearchQuery.toLowerCase();
    return metadata.all_states.filter((s) => s.toLowerCase().includes(q));
  }, [metadata.all_states, stateSearchQuery]);

  const filteredItems = useMemo(() => {
    if (!itemSearchQuery) return metadata.all_inventory_items;
    const q = itemSearchQuery.toLowerCase();
    return metadata.all_inventory_items.filter((i) => i.toLowerCase().includes(q));
  }, [metadata.all_inventory_items, itemSearchQuery]);

  // --- Toggle helpers ---

  const toggleState = (state: string) => {
    const next = new Set(selectedStates);
    if (next.has(state)) next.delete(state);
    else next.add(state);
    setSelectedStates(next);
  };

  const toggleItem = (item: string) => {
    const next = new Set(selectedItems);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    setSelectedItems(next);
  };

  const toggleExpanded = (userId: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedUsers(next);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStates(new Set());
    setSelectedItems(new Set());
  };

  // --- CSV Export ---

  const exportCSV = () => {
    const rows = [
      ['Name', 'Wallet', 'Node', 'Location', 'States', 'Inventory', 'Last Played'],
      ...filteredUsers.map((u) => [
        u.name || '',
        u.wallet_address,
        u.current_node_id || '',
        u.location || '',
        u.game_state ? Object.keys(u.game_state).join('; ') : '',
        u.inventory ? u.inventory.join('; ') : '',
        u.last_played_at ? new Date(u.last_played_at).toISOString() : '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Render ---

  if (loading) {
    return <div className="text-green-400 animate-pulse p-4">Loading game users...</div>;
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 border border-red-800">
        {error}
        <button onClick={loadData} className="ml-4 underline hover:text-red-300">
          Retry
        </button>
      </div>
    );
  }

  const activeFilterCount = selectedStates.size + selectedItems.size;

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
        <span>Total players: <span className="text-green-400">{users.length}</span></span>
        {activeFilterCount > 0 && (
          <span>
            Matching: <span className="text-green-400">{filteredUsers.length}</span>
            {' '}({activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active)
          </span>
        )}
      </div>

      {/* Search + Actions */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="admin-input max-w-xs"
          placeholder="Search by name or wallet..."
        />
        <button
          onClick={() => setShowStateFilter(!showStateFilter)}
          className={`px-3 py-1.5 text-xs border transition-colors ${
            selectedStates.size > 0
              ? 'bg-green-900/30 text-green-400 border-green-700'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
          }`}
        >
          STATES {selectedStates.size > 0 ? `(${selectedStates.size})` : ''}
        </button>
        <button
          onClick={() => setShowItemFilter(!showItemFilter)}
          className={`px-3 py-1.5 text-xs border transition-colors ${
            selectedItems.size > 0
              ? 'bg-blue-900/30 text-blue-400 border-blue-700'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'
          }`}
        >
          INVENTORY {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-800/30"
          >
            CLEAR
          </button>
        )}
        <button
          onClick={exportCSV}
          className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 ml-auto"
        >
          EXPORT CSV
        </button>
        <button
          onClick={loadData}
          className="px-3 py-1.5 text-xs bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
        >
          REFRESH
        </button>
      </div>

      {/* State filter dropdown */}
      {showStateFilter && (
        <FilterDropdown
          title="Filter by Game States"
          items={filteredStates}
          selected={selectedStates}
          onToggle={toggleState}
          searchQuery={stateSearchQuery}
          onSearchChange={setStateSearchQuery}
          onClose={() => setShowStateFilter(false)}
          color="green"
        />
      )}

      {/* Inventory filter dropdown */}
      {showItemFilter && (
        <FilterDropdown
          title="Filter by Inventory Items"
          items={filteredItems}
          selected={selectedItems}
          onToggle={toggleItem}
          searchQuery={itemSearchQuery}
          onSearchChange={setItemSearchQuery}
          onClose={() => setShowItemFilter(false)}
          color="blue"
        />
      )}

      {/* Users list */}
      <div className="space-y-1">
        {filteredUsers.length === 0 ? (
          <div className="text-gray-500 text-center py-8 border border-gray-800">
            {users.length === 0 ? 'No game users found.' : 'No users match the current filters.'}
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isExpanded = expandedUsers.has(user.user_id);
            const stateCount = user.game_state ? Object.keys(user.game_state).length : 0;
            const inventoryCount = user.inventory ? user.inventory.length : 0;

            return (
              <div key={user.user_id} className="border border-gray-800 bg-gray-900/50">
                {/* User row */}
                <div
                  className="flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-gray-800/30"
                  onClick={() => toggleExpanded(user.user_id)}
                >
                  <span className="text-green-300 w-32 truncate">{user.name || 'Unnamed'}</span>
                  <span className="text-gray-500 font-mono text-xs w-28 truncate">
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                  </span>
                  <span className="text-gray-400 text-xs w-28 truncate" title={user.current_node_id || ''}>
                    {user.current_node_id || '-'}
                  </span>
                  <span className="text-gray-400 text-xs w-20">{user.location || '-'}</span>
                  <span className="text-xs text-gray-500 w-20">
                    {stateCount} state{stateCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500 w-20">
                    {inventoryCount} item{inventoryCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-600 ml-auto">
                    {user.last_played_at
                      ? new Date(user.last_played_at).toLocaleDateString()
                      : 'Never played'}
                  </span>
                  <span className="text-gray-600 text-xs">{isExpanded ? '[-]' : '[+]'}</span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 py-3 border-t border-gray-800 text-xs space-y-3">
                    <div>
                      <span className="text-gray-400">Full Wallet: </span>
                      <span className="text-gray-300 font-mono">{user.wallet_address}</span>
                    </div>

                    {/* Game States */}
                    <div>
                      <span className="text-gray-400 block mb-1">
                        Game States ({stateCount}):
                      </span>
                      {user.game_state && stateCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(user.game_state).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-1.5 py-0.5 bg-green-900/20 text-green-400 border border-green-900/50"
                            >
                              {key}={String(value)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600">None</span>
                      )}
                    </div>

                    {/* Inventory */}
                    <div>
                      <span className="text-gray-400 block mb-1">
                        Inventory ({inventoryCount}):
                      </span>
                      {user.inventory && inventoryCount > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.inventory.map((item) => (
                            <span
                              key={item}
                              className="px-1.5 py-0.5 bg-blue-900/20 text-blue-400 border border-blue-900/50"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-600">Empty</span>
                      )}
                    </div>

                    {user.is_admin && (
                      <span className="text-yellow-400">Admin user</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Filter Dropdown Component ---

function FilterDropdown({
  title,
  items,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  onClose,
  color,
}: {
  title: string;
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onClose: () => void;
  color: 'green' | 'blue';
}) {
  const colorClasses = color === 'green'
    ? 'border-green-800 bg-green-900/10'
    : 'border-blue-800 bg-blue-900/10';

  const pillActive = color === 'green'
    ? 'bg-green-800 text-green-100 border-green-600'
    : 'bg-blue-800 text-blue-100 border-blue-600';

  const pillInactive = 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700';

  return (
    <div className={`mb-4 border p-3 ${colorClasses}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{title}</span>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300">
          close
        </button>
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="admin-input mb-2"
        placeholder={`Search ${title.toLowerCase()}...`}
      />
      <div className="flex flex-wrap gap-1 max-h-[200px] overflow-y-auto">
        {items.length === 0 ? (
          <span className="text-gray-600 text-xs">No items found</span>
        ) : (
          items.map((item) => (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                selected.has(item) ? pillActive : pillInactive
              }`}
            >
              {item}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
