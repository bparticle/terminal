'use client';

import { useState, useEffect } from 'react';
import {
  getWhitelist,
  addToWhitelist,
  bulkAddToWhitelist,
  updateWhitelistEntry,
  removeFromWhitelist,
  getMintLog,
} from '@/lib/mint-api';

type ModalType = 'add' | 'bulk' | 'edit' | null;
type ViewTab = 'whitelist' | 'log';

interface WhitelistEntry {
  id: string;
  wallet_address: string;
  max_mints: number;
  mints_used: number;
  is_active: boolean;
  added_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MintLogEntry {
  id: string;
  wallet_address: string;
  mint_type: string;
  asset_id: string | null;
  signature: string | null;
  nft_name: string;
  status: string;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export default function MintWhitelist() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [logs, setLogs] = useState<MintLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedEntry, setSelectedEntry] = useState<WhitelistEntry | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>('whitelist');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [addForm, setAddForm] = useState({ wallet: '', maxMints: 1, notes: '' });
  const [bulkForm, setBulkForm] = useState({ wallets: '', maxMints: 1 });
  const [editForm, setEditForm] = useState({ maxMints: 1, isActive: true, notes: '' });

  // Log filters
  const [logFilter, setLogFilter] = useState({ status: '', mintType: '', wallet: '' });
  const [whitelistSearch, setWhitelistSearch] = useState('');

  useEffect(() => {
    loadWhitelist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewTab === 'log') loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewTab, logFilter]);

  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => setStatusMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
  };

  const loadWhitelist = async () => {
    try {
      setLoading(true);
      const data = await getWhitelist();
      setEntries(data.entries);
    } catch {
      showStatus('error', 'Failed to load whitelist');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const filters: any = {};
      if (logFilter.status) filters.status = logFilter.status;
      if (logFilter.mintType) filters.mint_type = logFilter.mintType;
      if (logFilter.wallet) filters.wallet = logFilter.wallet;
      const data = await getMintLog(filters);
      setLogs(data.logs);
    } catch {
      showStatus('error', 'Failed to load mint logs');
    }
  };

  const handleAdd = async () => {
    if (!addForm.wallet.trim()) return;
    setSaving(true);
    try {
      await addToWhitelist(addForm.wallet.trim(), addForm.maxMints, addForm.notes.trim() || undefined);
      showStatus('success', 'Wallet added to whitelist');
      setActiveModal(null);
      setAddForm({ wallet: '', maxMints: 1, notes: '' });
      loadWhitelist();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to add wallet');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const wallets = bulkForm.wallets
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean);
    if (wallets.length === 0) return;
    setSaving(true);
    try {
      const result = await bulkAddToWhitelist(wallets, bulkForm.maxMints);
      showStatus('success', `Added ${result.added}, updated ${result.updated} wallets (${result.skipped} skipped)`);
      setActiveModal(null);
      setBulkForm({ wallets: '', maxMints: 1 });
      loadWhitelist();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to bulk add');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedEntry) return;
    setSaving(true);
    try {
      await updateWhitelistEntry(selectedEntry.wallet_address, {
        max_mints: editForm.maxMints,
        is_active: editForm.isActive,
        notes: editForm.notes.trim() || undefined,
      });
      showStatus('success', 'Whitelist entry updated');
      setActiveModal(null);
      loadWhitelist();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (wallet: string) => {
    if (!confirm(`Remove ${wallet.slice(0, 8)}... from whitelist?`)) return;
    try {
      await removeFromWhitelist(wallet);
      showStatus('success', 'Wallet removed from whitelist');
      loadWhitelist();
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to remove');
    }
  };

  const openEdit = (entry: WhitelistEntry) => {
    setSelectedEntry(entry);
    setEditForm({
      maxMints: entry.max_mints,
      isActive: entry.is_active,
      notes: entry.notes || '',
    });
    setActiveModal('edit');
  };

  const exportCSV = (type: 'whitelist' | 'log') => {
    let csv = '';
    if (type === 'whitelist') {
      csv = 'wallet_address,max_mints,mints_used,is_active,notes,added_by,created_at\n';
      csv += entries.map((e) =>
        `${e.wallet_address},${e.max_mints},${e.mints_used},${e.is_active},"${(e.notes || '').replace(/"/g, '""')}",${e.added_by},${e.created_at}`
      ).join('\n');
    } else {
      csv = 'wallet_address,nft_name,mint_type,status,asset_id,signature,created_at\n';
      csv += logs.map((l) =>
        `${l.wallet_address},"${l.nft_name.replace(/"/g, '""')}",${l.mint_type},${l.status},${l.asset_id || ''},${l.signature || ''},${l.created_at}`
      ).join('\n');
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shortAddr = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const normalizedWhitelistSearch = whitelistSearch.trim().toLowerCase();
  const filteredEntries = entries.filter((entry) =>
    entry.wallet_address.toLowerCase().includes(normalizedWhitelistSearch)
  );

  return (
    <div>
      {/* Status message */}
      {statusMessage && (
        <div className={`mb-4 p-3 border text-sm ${
          statusMessage.type === 'success'
            ? 'bg-green-900/30 border-green-700 text-green-400'
            : 'bg-red-900/30 border-red-700 text-red-400'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setViewTab('whitelist')}
          className={`px-3 py-1.5 text-sm border transition-colors ${
            viewTab === 'whitelist'
              ? 'bg-green-900/50 text-green-400 border-green-700'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'
          }`}
        >
          Whitelist ({entries.length})
        </button>
        <button
          onClick={() => setViewTab('log')}
          className={`px-3 py-1.5 text-sm border transition-colors ${
            viewTab === 'log'
              ? 'bg-green-900/50 text-green-400 border-green-700'
              : 'bg-gray-900 text-gray-400 border-gray-700 hover:bg-gray-800'
          }`}
        >
          Mint Log
        </button>
      </div>

      {/* WHITELIST VIEW */}
      {viewTab === 'whitelist' && (
        <div>
          {/* Actions */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <button
              onClick={() => { setAddForm({ wallet: '', maxMints: 1, notes: '' }); setActiveModal('add'); }}
              className="px-3 py-1.5 text-sm bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-800/50"
            >
              + Add Wallet
            </button>
            <button
              onClick={() => { setBulkForm({ wallets: '', maxMints: 1 }); setActiveModal('bulk'); }}
              className="px-3 py-1.5 text-sm bg-blue-900/50 text-blue-400 border border-blue-700 hover:bg-blue-800/50"
            >
              Bulk Add
            </button>
            <button
              onClick={() => exportCSV('whitelist')}
              className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
            >
              Export CSV
            </button>
            <input
              type="text"
              placeholder="Search wallet..."
              value={whitelistSearch}
              onChange={(e) => setWhitelistSearch(e.target.value)}
              className="px-2 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 w-52 font-mono"
            />
          </div>

          {/* Table */}
          {loading ? (
            <p className="text-gray-400 animate-pulse">Loading whitelist...</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500">No wallets whitelisted yet.</p>
          ) : filteredEntries.length === 0 ? (
            <p className="text-gray-500">No wallets found for that search.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 px-3">Wallet</th>
                    <th className="py-2 px-3">Max</th>
                    <th className="py-2 px-3">Used</th>
                    <th className="py-2 px-3">Remaining</th>
                    <th className="py-2 px-3">Active</th>
                    <th className="py-2 px-3">Notes</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-2 px-3 font-mono text-green-400" title={entry.wallet_address}>
                        {shortAddr(entry.wallet_address)}
                      </td>
                      <td className="py-2 px-3 text-gray-300">
                        {entry.max_mints === 0 ? '∞' : entry.max_mints}
                      </td>
                      <td className="py-2 px-3 text-gray-300">{entry.mints_used}</td>
                      <td className="py-2 px-3 text-gray-300">
                        {entry.max_mints === 0 ? '∞' : Math.max(0, entry.max_mints - entry.mints_used)}
                      </td>
                      <td className="py-2 px-3">
                        <span className={entry.is_active ? 'text-green-400' : 'text-red-400'}>
                          {entry.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-500 max-w-[200px] truncate" title={entry.notes || ''}>
                        {entry.notes || '-'}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(entry)}
                            className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.wallet_address)}
                            className="px-2 py-0.5 text-xs bg-red-900/50 text-red-400 border border-red-700 hover:bg-red-800/50"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MINT LOG VIEW */}
      {viewTab === 'log' && (
        <div>
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              value={logFilter.status}
              onChange={(e) => setLogFilter((f) => ({ ...f, status: e.target.value }))}
              className="px-2 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600"
            >
              <option value="">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={logFilter.mintType}
              onChange={(e) => setLogFilter((f) => ({ ...f, mintType: e.target.value }))}
              className="px-2 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600"
            >
              <option value="">All types</option>
              <option value="standard">Standard</option>
              <option value="soulbound">Soulbound</option>
            </select>
            <input
              type="text"
              placeholder="Filter by wallet..."
              value={logFilter.wallet}
              onChange={(e) => setLogFilter((f) => ({ ...f, wallet: e.target.value }))}
              className="px-2 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600 w-48"
            />
            <button
              onClick={() => exportCSV('log')}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
            >
              Export CSV
            </button>
          </div>

          {/* Log table */}
          {logs.length === 0 ? (
            <p className="text-gray-500">No mint logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Wallet</th>
                    <th className="py-2 px-3">NFT Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-mono text-green-400" title={log.wallet_address}>
                        {shortAddr(log.wallet_address)}
                      </td>
                      <td className="py-2 px-3 text-gray-300">{log.nft_name}</td>
                      <td className="py-2 px-3">
                        <span className={log.mint_type === 'soulbound' ? 'text-purple-400' : 'text-gray-300'}>
                          {log.mint_type}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={
                          log.status === 'confirmed' ? 'text-green-400' :
                          log.status === 'failed' ? 'text-red-400' :
                          'text-yellow-400'
                        }>
                          {log.status}
                        </span>
                        {log.error_message && (
                          <span className="block text-xs text-red-400/70 truncate max-w-[200px]" title={log.error_message}>
                            {log.error_message}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono text-gray-500 text-xs">
                        {log.signature ? `${log.signature.slice(0, 16)}...` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            {/* Add single wallet */}
            {activeModal === 'add' && (
              <>
                <h3 className="text-lg text-green-400 mb-4">Add Wallet to Whitelist</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
                    <input
                      type="text"
                      value={addForm.wallet}
                      onChange={(e) => setAddForm((f) => ({ ...f, wallet: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm font-mono"
                      placeholder="Solana wallet address..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Mints (0 = unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      value={addForm.maxMints}
                      onChange={(e) => setAddForm((f) => ({ ...f, maxMints: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={addForm.notes}
                      onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm"
                      placeholder="Reason for whitelisting..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving || !addForm.wallet.trim()}
                    className="px-4 py-2 text-sm bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-800/50 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </>
            )}

            {/* Bulk add */}
            {activeModal === 'bulk' && (
              <>
                <h3 className="text-lg text-blue-400 mb-4">Bulk Add Wallets</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Wallet Addresses (one per line)</label>
                    <textarea
                      value={bulkForm.wallets}
                      onChange={(e) => setBulkForm((f) => ({ ...f, wallets: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm font-mono h-40 resize-y"
                      placeholder="Paste wallet addresses, one per line..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Mints Per Wallet (0 = unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      value={bulkForm.maxMints}
                      onChange={(e) => setBulkForm((f) => ({ ...f, maxMints: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {bulkForm.wallets.split('\n').filter((w) => w.trim()).length} wallets detected. Duplicates will be skipped.
                  </p>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    disabled={saving || !bulkForm.wallets.trim()}
                    className="px-4 py-2 text-sm bg-blue-900/50 text-blue-400 border border-blue-700 hover:bg-blue-800/50 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Bulk Add'}
                  </button>
                </div>
              </>
            )}

            {/* Edit entry */}
            {activeModal === 'edit' && selectedEntry && (
              <>
                <h3 className="text-lg text-green-400 mb-2">Edit Whitelist Entry</h3>
                <p className="text-sm text-gray-500 font-mono mb-4">{selectedEntry.wallet_address}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Mints (0 = unlimited)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.maxMints}
                      onChange={(e) => setEditForm((f) => ({ ...f, maxMints: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-active"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="accent-green-500"
                    />
                    <label htmlFor="is-active" className="text-sm text-gray-400">Active</label>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Notes</label>
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 text-gray-200 border border-gray-600 text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Currently used: {selectedEntry.mints_used} mints
                  </p>
                </div>
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-800/50 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
