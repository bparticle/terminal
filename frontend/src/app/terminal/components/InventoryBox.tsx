'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  maxItems?: number;
}

const ITEMS_PER_PAGE = 2;
const CLOSE_DELAY_MS = 120;
const HOVER_PADDING = 8; // px buffer around rects before triggering close

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
  onOpen,
  onClose,
}: {
  item: InventoryItem;
  isHighlight: boolean;
  slotKey: string;
  isOpen: boolean;
  onOpen: (slotKey: string) => void;
  onClose: (slotKey: string) => void;
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ right: number; bottom: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  // Compute position and drive CSS visibility when open state changes
  useEffect(() => {
    if (isOpen) {
      if (slotRef.current) {
        const rect = slotRef.current.getBoundingClientRect();
        setTooltipPos({
          right: window.innerWidth - rect.right,
          bottom: window.innerHeight - rect.top + 10,
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

  // Global pointermove: geometry-based close detection
  // This completely sidesteps mouseenter/mouseleave DOM hierarchy issues.
  useEffect(() => {
    if (!isOpen) return;

    const onMove = (e: PointerEvent) => {
      // Throttle to one check per animation frame
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const { clientX: x, clientY: y } = e;
        const slotRect = slotRef.current?.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();

        const inSlot = slotRect &&
          x >= slotRect.left - HOVER_PADDING &&
          x <= slotRect.right + HOVER_PADDING &&
          y >= slotRect.top - HOVER_PADDING &&
          y <= slotRect.bottom + HOVER_PADDING;

        const inTooltip = tooltipRect &&
          x >= tooltipRect.left - HOVER_PADDING &&
          x <= tooltipRect.right + HOVER_PADDING &&
          y >= tooltipRect.top - HOVER_PADDING &&
          y <= tooltipRect.bottom + HOVER_PADDING;

        if (inSlot || inTooltip) {
          if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
          }
        } else if (!closeTimerRef.current) {
          closeTimerRef.current = setTimeout(() => {
            closeTimerRef.current = null;
            onClose(slotKey);
          }, CLOSE_DELAY_MS);
        }
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    };
  }, [isOpen, slotKey, onClose]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const handlePointerEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onOpen(slotKey);
  }, [slotKey, onOpen]);

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
      onPointerEnter={handlePointerEnter}
    >
      <ItemIcon name={item.name} />
      {item.soulbound && <SoulboundBadge />}
      {tooltipPos && createPortal(
        <div
          ref={tooltipRef}
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

export default function InventoryBox({ items, maxItems = 12 }: InventoryBoxProps) {
  const [page, setPage] = useState(0);
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const [openSlotKey, setOpenSlotKey] = useState<string | null>(null);
  const prevItemsRef = useRef<string[]>([]);

  const openTooltip = useCallback((key: string) => setOpenSlotKey(key), []);
  const closeTooltip = useCallback((key: string) => {
    setOpenSlotKey((prev) => (prev === key ? null : prev));
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
                onOpen={openTooltip}
                onClose={closeTooltip}
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
