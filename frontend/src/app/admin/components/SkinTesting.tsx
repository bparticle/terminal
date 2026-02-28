'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAdminSkinOverrideStorageKey, readAdminSkinOverride, writeAdminSkinOverride } from '@/skins/admin-override';
import { listAvailableSkins } from '@/skins/resolver';

export default function SkinTesting() {
  const [overrideId, setOverrideId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const skins = useMemo(() => listAvailableSkins(), []);

  useEffect(() => {
    setOverrideId(readAdminSkinOverride());
  }, []);

  const applySkin = (skinId: string | null) => {
    writeAdminSkinOverride(skinId);
    setOverrideId(skinId);
    setStatus(
      skinId
        ? `Skin override set to "${skinId}". Open /terminal as admin to preview.`
        : 'Skin override cleared. Campaign/default resolution is active.'
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-green-400 border-b border-green-900 pb-2">Skin Testing</h2>

      <div className="bg-gray-900 border border-gray-700 p-4 rounded space-y-2">
        <div className="text-sm text-gray-300">
          Current override:{' '}
          <span className={overrideId ? 'text-yellow-400' : 'text-gray-500'}>
            {overrideId || 'none'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          This override is local to your browser and only intended for admin testing. It does not change campaign data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {skins.map((skin) => {
          const isActive = skin.id === overrideId;
          return (
            <button
              key={skin.id}
              onClick={() => applySkin(skin.id)}
              className={`text-left p-3 border transition-colors ${
                isActive
                  ? 'border-green-600 bg-green-900/30'
                  : 'border-gray-700 bg-gray-900 hover:bg-gray-800'
              }`}
            >
              <div className="text-sm text-green-300">{skin.displayName}</div>
              <div className="text-xs text-gray-500 mt-1">{skin.id}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => applySkin(null)}
          className="px-4 py-2 text-sm bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
        >
          CLEAR OVERRIDE
        </button>
        {status && <span className="text-sm text-green-400">{status}</span>}
      </div>

      <div className="text-xs text-gray-500 border border-gray-800 bg-gray-900/40 p-3 rounded">
        Storage key: <code>{getAdminSkinOverrideStorageKey()}</code>
      </div>
    </div>
  );
}
