'use client';

import { useEffect, useState } from 'react';
import { getSiteStatus, updateSiteSettings } from '@/lib/admin-api';

export default function SiteSettings() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('COMING SOON');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSiteStatus();
      setEnabled(data.maintenance);
      setMessage(data.message || 'COMING SOON');
    } catch (error) {
      console.error('Failed to load site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await updateSiteSettings(enabled, message);
      setStatus({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-green-400 animate-pulse p-4">Loading site settings...</div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-green-400 border-b border-green-900 pb-2">
        Site Settings
      </h2>

      {/* Current Status */}
      <div className="bg-gray-900 border border-gray-700 p-4 rounded">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-gray-400 text-sm">Current Status:</span>
          <span
            className={`text-sm font-bold ${
              enabled ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {enabled ? 'MAINTENANCE MODE ON' : 'SITE LIVE'}
          </span>
        </div>
        <p className="text-gray-500 text-xs">
          {enabled
            ? 'Visitors see the coming-soon page. Admin panel remains accessible.'
            : 'Site is publicly accessible to all visitors.'}
        </p>
      </div>

      {/* Toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-gray-300 text-sm w-40">Maintenance Mode</label>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              enabled ? 'bg-red-700' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm ${enabled ? 'text-red-400' : 'text-gray-500'}`}>
            {enabled ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Message */}
        <div className="flex items-start gap-4">
          <label className="text-gray-300 text-sm w-40 pt-2">Display Message</label>
          <div className="flex-1">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="w-full bg-gray-800 border border-gray-600 text-green-400 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="COMING SOON"
            />
            <p className="text-gray-600 text-xs mt-1">
              Shown on the coming-soon page when maintenance mode is enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 text-sm border transition-colors ${
            saving
              ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
              : 'bg-green-900/50 text-green-400 border-green-700 hover:bg-green-800/50'
          }`}
        >
          {saving ? 'SAVING...' : 'SAVE SETTINGS'}
        </button>

        {status && (
          <span
            className={`text-sm ${
              status.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {status.text}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-900/50 border border-gray-800 p-3 text-xs text-gray-500 space-y-1">
        <p>Notes:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Maintenance mode only applies in production. Local development is never blocked.</li>
          <li>The /admin page is always accessible, even during maintenance.</li>
          <li>Changes take effect immediately for new page loads.</li>
        </ul>
      </div>
    </div>
  );
}
