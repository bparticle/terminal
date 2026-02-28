'use client';

import { useState, useEffect, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { genericItemPngSrc, itemPngSrc } from '@/lib/item-image';

interface InventoryItem {
  name: string;
  soulbound?: boolean;
  assetId?: string;
  isFrozen?: boolean;
}

interface InventoryBoxProps {
  items: InventoryItem[];
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
        src={itemPngSrc(name)}
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
        src={genericItemPngSrc()}
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

function LocalItemTooltipContent({ item }: { item: InventoryItem }) {
  return (
    <>
      <div className="soulbound-tooltip-title">{item.name.replace(/_/g, ' ')}</div>
      <div className="soulbound-tooltip-tag local-item-tooltip-tag">◉ LOCAL ITEM</div>
      <div className="soulbound-tooltip-row">
        <span className="soulbound-tooltip-label">Status</span>
        <span className="soulbound-tooltip-value">Stored locally</span>
      </div>
    </>
  );
}

function ItemSlot({
  item,
  isHighlight,
  slotKey,
  isOpen,
  onToggle,
}: {
  item: InventoryItem;
  isHighlight: boolean;
  slotKey: string;
  isOpen: boolean;
  onToggle: (slotKey: string) => void;
}) {
  const TOOLTIP_WIDTH = 220;
  const TOOLTIP_HEIGHT = 150;
  const TOOLTIP_PADDING = 10;
  const slotRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ right: number; bottom: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Compute position and drive CSS visibility when open state changes
  useEffect(() => {
    if (isOpen) {
      if (slotRef.current) {
        const rect = slotRef.current.getBoundingClientRect();
        const preferredRight = window.innerWidth - rect.right;
        const preferredBottom = window.innerHeight - rect.top + 10;

        // Keep original placement by default; clamp only when it would overflow.
        const maxRight = window.innerWidth - TOOLTIP_WIDTH - TOOLTIP_PADDING;
        const clampedRight = Math.min(Math.max(preferredRight, TOOLTIP_PADDING), maxRight);

        const maxBottom = window.innerHeight - TOOLTIP_HEIGHT - TOOLTIP_PADDING;
        let clampedBottom = Math.min(Math.max(preferredBottom, TOOLTIP_PADDING), maxBottom);

        // If there is not enough space above, place tooltip below the slot.
        if (preferredBottom > maxBottom) {
          const belowBottom = window.innerHeight - rect.bottom - 10;
          clampedBottom = Math.min(Math.max(belowBottom, TOOLTIP_PADDING), maxBottom);
        }

        setTooltipPos({
          right: clampedRight,
          bottom: clampedBottom,
        });
      }
      // Render at opacity:0 first, then flip to is-open in the next frame
      // so the browser has a chance to paint before the transition starts.
      rafRef.current = requestAnimationFrame(() => {
        setIsVisible(true);
        rafRef.current = null;
      });
    } else {
      setIsVisible(false);
      // Keep tooltipPos so the closing transition renders at the correct position
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleClick = useCallback(() => {
    onToggle(slotKey);
  }, [slotKey, onToggle]);

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle(slotKey);
    }
  }, [slotKey, onToggle]);

  if (!item.name) {
    return (
      <div className="inventory-slot empty">
        <span className="empty-slot">-</span>
      </div>
    );
  }

  return (
    <div
      ref={slotRef}
      className={`inventory-slot has-item ${isHighlight ? 'highlight' : ''} ${item.soulbound ? 'soulbound' : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-label={`Inspect ${item.name.replace(/_/g, ' ')}`}
    >
      <ItemIcon name={item.name} />
      {item.soulbound && <SoulboundBadge />}
      {tooltipPos && createPortal(
        <div
          className={`soulbound-tooltip${isVisible ? ' is-open' : ''}`}
          style={{ right: tooltipPos.right, bottom: tooltipPos.bottom }}
        >
          {item.soulbound
            ? <SoulboundTooltipContent item={item} />
            : <LocalItemTooltipContent item={item} />}
        </div>,
        document.body,
      )}
    </div>
  );
}

export default function InventoryBox({ items }: InventoryBoxProps) {
  const [page, setPage] = useState(0);
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const [openSlotKey, setOpenSlotKey] = useState<string | null>(null);
  const prevItemsRef = useRef<string[]>([]);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleTooltip = useCallback((key: string) => {
    setOpenSlotKey((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    if (!openSlotKey) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target) return;

      const clickedSlot = target.closest('.inventory-slot.has-item');
      const clickedTooltip = target.closest('.soulbound-tooltip');
      if (!clickedSlot && !clickedTooltip) {
        setOpenSlotKey(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenSlotKey(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [openSlotKey]);

  useEffect(() => {
    const prevNames = prevItemsRef.current;
    const currentNames = items.map((i) => i.name);

    const newItems = currentNames.filter((n) => !prevNames.includes(n));
    if (newItems.length > 0) {
      const newestItemName = newItems[newItems.length - 1];
      const newestItemIndex = currentNames.lastIndexOf(newestItemName);
      const targetPage = Math.floor(newestItemIndex / ITEMS_PER_PAGE);

      setPage(targetPage);
      setHighlightItem(newestItemName);
      setOpenSlotKey(null);

      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
      highlightTimerRef.current = setTimeout(() => {
        setHighlightItem(null);
        highlightTimerRef.current = null;
      }, 2000);
    }

    prevItemsRef.current = currentNames;
  }, [items]);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages - 1));
  }, [totalPages]);

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
        Inventory ({items.length})
      </div>

      <div className="inventory-grid">
        <div className="inventory-slots">
          {slots.map((item, i) => {
            const slotKey = `${startIdx + i}-${item.name}`;
            return (
              <ItemSlot
                key={slotKey}
                item={item}
                isHighlight={item.name === highlightItem}
                slotKey={slotKey}
                isOpen={openSlotKey === slotKey}
                onToggle={toggleTooltip}
              />
            );
          })}
        </div>
      </div>

      {hasMultiplePages && (
        <div className="inventory-pager" role="group" aria-label="Inventory pagination">
          <button
            className="nav-btn nav-arrow"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous inventory page"
          >
            ◄
          </button>

          <div className="inventory-pager-dots" aria-hidden="true">
            {Array.from({ length: totalPages }, (_, idx) => (
              <span
                key={`page-dot-${idx}`}
                className={`inventory-page-dot ${idx === page ? 'active' : ''}`}
              />
            ))}
          </div>

          <div className="inventory-page-label">
            {page + 1}/{totalPages}
          </div>

          <button
            className="nav-btn nav-arrow"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next inventory page"
          >
            ►
          </button>
        </div>
      )}
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
