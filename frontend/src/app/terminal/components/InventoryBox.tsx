'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface InventoryItem {
  name: string;
  soulbound?: boolean;
  assetId?: string;
  isFrozen?: boolean;
}

interface InventoryBoxProps {
  items: InventoryItem[];
  maxItems?: number;
}

const ITEMS_PER_PAGE = 2;

// Two-step fallback: item-specific PNG → _generic.png → emoji
function ItemIcon({ name }: { name: string }) {
  const [imgState, setImgState] = useState<'specific' | 'generic' | 'emoji'>('specific');
  const handleSpecificError = useCallback(() => setImgState('generic'), []);
  const handleGenericError = useCallback(() => setImgState('emoji'), []);

  if (imgState === 'specific') {
    return (
      <Image
        src={`/items/${name}.png`}
        alt={name.replace(/_/g, ' ')}
        width={48}
        height={48}
        className="item-icon-img"
        onError={handleSpecificError}
        draggable={false}
      />
    );
  }

  if (imgState === 'generic') {
    return (
      <Image
        src="/items/_generic.png"
        alt={name.replace(/_/g, ' ')}
        width={48}
        height={48}
        className="item-icon-img"
        onError={handleGenericError}
        draggable={false}
      />
    );
  }

  return <span className="item-icon">{getItemEmoji(name)}</span>;
}

function SoulboundBadge() {
  return <span className="soulbound-badge" aria-hidden="true">⛓</span>;
}

function SoulboundTooltipContent({ item }: { item: InventoryItem }) {
  const shortAsset = item.assetId
    ? `${item.assetId.slice(0, 6)}…${item.assetId.slice(-4)}`
    : null;
  const explorerUrl = item.assetId
    ? `https://xray.helius.xyz/token/${item.assetId}`
    : null;

  return (
    <>
      <div className="soulbound-tooltip-title">{item.name.replace(/_/g, ' ')}</div>
      <div className="soulbound-tooltip-tag">⛓ SOULBOUND NFT</div>
      {item.assetId ? (
        <>
          <div className="soulbound-tooltip-row">
            <span className="soulbound-tooltip-label">Asset</span>
            <span className="soulbound-tooltip-value">{shortAsset}</span>
          </div>
          <div className="soulbound-tooltip-row">
            <span className="soulbound-tooltip-label">Status</span>
            <span className={item.isFrozen ? 'soulbound-status-frozen' : 'soulbound-status-pending'}>
              {item.isFrozen ? '● Frozen' : '◌ Pending'}
            </span>
          </div>
          <a
            href={explorerUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="soulbound-tooltip-link"
          >
            View on-chain ↗
          </a>
        </>
      ) : (
        <div className="soulbound-tooltip-row">
          <span className="soulbound-tooltip-label">Status</span>
          <span className="soulbound-status-pending">◌ Minting…</span>
        </div>
      )}
    </>
  );
}

function ItemSlot({
  item,
  isHighlight,
  slotKey,
  isTooltipOpen,
  onOpenTooltip,
  onScheduleCloseTooltip,
}: {
  item: InventoryItem;
  isHighlight: boolean;
  slotKey: string;
  isTooltipOpen: boolean;
  onOpenTooltip: (slotKey: string) => void;
  onScheduleCloseTooltip: (slotKey: string) => void;
}) {
  if (!item.name) {
    return (
      <div className="inventory-slot empty">
        <span className="empty-slot">-</span>
      </div>
    );
  }

  return (
    <div
      className={`inventory-slot has-item ${isHighlight ? 'highlight' : ''} ${item.soulbound ? 'soulbound' : ''}`}
      onMouseEnter={item.soulbound ? () => onOpenTooltip(slotKey) : undefined}
      onMouseLeave={item.soulbound ? () => onScheduleCloseTooltip(slotKey) : undefined}
      title={!item.soulbound ? item.name.replace(/_/g, ' ') : undefined}
    >
      <ItemIcon name={item.name} />
      {item.soulbound && <SoulboundBadge />}
      {isTooltipOpen && (
        <div
          className="soulbound-tooltip"
          onMouseEnter={() => onOpenTooltip(slotKey)}
          onMouseLeave={() => onScheduleCloseTooltip(slotKey)}
        >
          <SoulboundTooltipContent item={item} />
        </div>
      )}
    </div>
  );
}

export default function InventoryBox({ items, maxItems = 12 }: InventoryBoxProps) {
  const [page, setPage] = useState(0);
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const [activeTooltipKey, setActiveTooltipKey] = useState<string | null>(null);
  const prevItemsRef = useRef<string[]>([]);
  const closeTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTooltip = useCallback((slotKey: string) => {
    if (closeTooltipTimerRef.current) clearTimeout(closeTooltipTimerRef.current);
    setActiveTooltipKey(slotKey);
  }, []);

  const scheduleCloseTooltip = useCallback((slotKey: string) => {
    if (closeTooltipTimerRef.current) clearTimeout(closeTooltipTimerRef.current);
    closeTooltipTimerRef.current = setTimeout(() => {
      setActiveTooltipKey((current) => (current === slotKey ? null : current));
    }, 200);
  }, []);

  useEffect(() => {
    const prevNames = prevItemsRef.current;
    const currentNames = items.map((i) => i.name);

    const newItems = currentNames.filter((n) => !prevNames.includes(n));
    if (newItems.length > 0) {
      setHighlightItem(newItems[newItems.length - 1]);
      setTimeout(() => setHighlightItem(null), 2000);
    }

    prevItemsRef.current = currentNames;
  }, [items]);

  useEffect(() => {
    return () => {
      if (closeTooltipTimerRef.current) clearTimeout(closeTooltipTimerRef.current);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const startIdx = page * ITEMS_PER_PAGE;
  const pageItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const slots: InventoryItem[] = [...pageItems];
  while (slots.length < ITEMS_PER_PAGE) {
    slots.push({ name: '' });
  }

  const hasMultiplePages = items.length > ITEMS_PER_PAGE;

  return (
    <div className="panel-box inventory-box">
      <div className="panel-title">
        Inventory ({items.length}/{maxItems})
      </div>

      <div className="inventory-row">
        <button
          className="nav-btn nav-arrow"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={!hasMultiplePages || page === 0}
        >
          ◄
        </button>

        <div className="inventory-slots">
          {slots.map((item, i) => (
            (() => {
              const slotKey = `${startIdx + i}-${item.name}`;
              return (
            <ItemSlot
              key={slotKey}
              item={item}
              isHighlight={item.name === highlightItem}
              slotKey={slotKey}
              isTooltipOpen={activeTooltipKey === slotKey}
              onOpenTooltip={openTooltip}
              onScheduleCloseTooltip={scheduleCloseTooltip}
            />
              );
            })()
          ))}
        </div>

        <button
          className="nav-btn nav-arrow"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={!hasMultiplePages || page >= totalPages - 1}
        >
          ►
        </button>
      </div>
    </div>
  );
}

function getItemEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('key') || lower.includes('keycard')) return '🔑';
  if (lower.includes('tape')) return '📼';
  if (lower.includes('crystal')) return '💎';
  if (lower.includes('interface') || lower.includes('neural')) return '🧠';
  if (lower.includes('sword') || lower.includes('blade')) return '⚔️';
  if (lower.includes('vial') || lower.includes('potion')) return '🧪';
  if (lower.includes('book') || lower.includes('note')) return '📖';
  if (lower.includes('map')) return '🗺️';
  if (lower.includes('shield')) return '🛡️';
  if (lower.includes('coin') || lower.includes('gold')) return '🪙';
  return '📦';
}
