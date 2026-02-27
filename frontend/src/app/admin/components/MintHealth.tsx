'use client';

import { useState, useEffect } from 'react';
import { getMintHealth, type StuckMint, type UnfrozenSoulbound } from '@/lib/admin-api';

function shortWallet(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'failed'   ? 'text-red-400 border-red-800 bg-red-900/20' :
    status === 'pending'  ? 'text-yellow-400 border-yellow-800 bg-yellow-900/20' :
    status === 'prepared' ? 'text-orange-400 border-orange-800 bg-orange-900/20' :
                            'text-gray-400 border-gray-700 bg-gray-900/20';
  return (
    <span className={`px-1.5 py-0.5 text-xs border font-mono uppercase ${color}`}>
      {status}
    </span>
  );
}

export default function MintHealth() {
  const [data, setData] = useState<{ stuckMints: StuckMint[]; unFrozenSoulbound: UnfrozenSoulbound[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMintHealth();
      setData(result);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const failed   = data?.stuckMints.filter(m => m.status === 'failed') ?? [];
  const pending  = data?.stuckMints.filter(m => m.status === 'pending') ?? [];
  const prepared = data?.stuckMints.filter(m => m.status === 'prepared') ?? [];
  const unfrozen = data?.unFrozenSoulbound ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg text-green-400">Mint Health</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Stuck pending (&gt;5 min), stuck prepared (&gt;10 min), all failures, and unfrozen soulbound items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-600">
              refreshed {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800 text-red-400 text-sm">{error}</div>
      )}

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Failed',           count: failed.length,   color: 'border-red-800 text-red-400' },
            { label: 'Stuck Pending',    count: pending.length,  color: 'border-yellow-800 text-yellow-400' },
            { label: 'Stuck Prepared',   count: prepared.length, color: 'border-orange-800 text-orange-400' },
            { label: 'Unfrozen Soulbound', count: unfrozen.length, color: 'border-blue-800 text-blue-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`p-4 bg-gray-900 border ${color} text-center`}>
              <div className={`text-3xl font-mono ${color.split(' ')[1]}`}>{count}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stuck / Failed Mints table */}
      <div>
        <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
          Stuck & Failed Mints ({data?.stuckMints.length ?? 0})
        </h3>
        {loading && !data ? (
          <div className="text-sm text-gray-500 py-4">Loading...</div>
        ) : data?.stuckMints.length === 0 ? (
          <div className="p-4 bg-gray-900 border border-gray-800 text-sm text-green-600">
            ✓ No stuck or failed mints
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-800">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  {['Player', 'Wallet', 'Type', 'NFT Name', 'Status', 'Age', 'Error'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 uppercase tracking-wider font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.stuckMints.map((mint) => (
                  <tr key={mint.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-2 text-gray-300">{mint.user_name ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-gray-500 text-xs">
                      <span title={mint.wallet_address}>{shortWallet(mint.wallet_address)}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-400 font-mono text-xs">{mint.mint_type}</td>
                    <td className="px-3 py-2 text-gray-300 max-w-[160px] truncate" title={mint.nft_name}>
                      {mint.nft_name}
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={mint.status} /></td>
                    <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{timeAgo(mint.created_at)}</td>
                    <td className="px-3 py-2 text-red-400 text-xs max-w-[200px] truncate" title={mint.error_message ?? ''}>
                      {mint.error_message ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unfrozen Soulbound table */}
      <div>
        <h3 className="text-sm text-gray-400 mb-2 uppercase tracking-wider">
          Unfrozen Soulbound Items ({unfrozen.length})
        </h3>
        {loading && !data ? (
          <div className="text-sm text-gray-500 py-4">Loading...</div>
        ) : unfrozen.length === 0 ? (
          <div className="p-4 bg-gray-900 border border-gray-800 text-sm text-green-600">
            ✓ All soulbound items are frozen
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-800">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  {['Player', 'Wallet', 'Item', 'Asset ID', 'Minted', 'Last Updated'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-xs text-gray-500 uppercase tracking-wider font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unfrozen.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                    <td className="px-3 py-2 text-gray-300">{item.user_name ?? '—'}</td>
                    <td className="px-3 py-2 font-mono text-gray-500 text-xs">
                      <span title={item.wallet_address}>{shortWallet(item.wallet_address)}</span>
                    </td>
                    <td className="px-3 py-2 text-blue-400 font-mono text-xs">{item.item_name}</td>
                    <td className="px-3 py-2 font-mono text-gray-500 text-xs">
                      <span title={item.asset_id}>{shortWallet(item.asset_id)}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{timeAgo(item.created_at)}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs whitespace-nowrap">{timeAgo(item.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
