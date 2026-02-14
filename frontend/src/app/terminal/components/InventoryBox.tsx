'use client';

import { useState, useEffect, useRef } from 'react';

interface InventoryBoxProps {
  items: Array<{ name: string }>;
  maxItems?: number;
}

const ITEMS_PER_PAGE = 2;

export default function InventoryBox({ items, maxItems = 12 }: InventoryBoxProps) {
  const [page, setPage] = useState(0);
  const [highlightItem, setHighlightItem] = useState<string | null>(null);
  const prevItemsRef = useRef<string[]>([]);

  // Detect new items for highlight
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

  // Fill empty slots
  const slots = [...pageItems];
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
            <div
              key={`${startIdx + i}-${item.name}`}
              className={`inventory-slot ${item.name ? 'has-item' : 'empty'} ${item.name === highlightItem ? 'highlight' : ''}`}
              title={item.name || 'Empty'}
            >
              {item.name ? (
                <span className="item-icon">
                  {getItemEmoji(item.name)}
                </span>
              ) : (
                <span className="empty-slot">-</span>
              )}
            </div>
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
  if (lower.includes('potion')) return '🧪';
  if (lower.includes('book') || lower.includes('note')) return '📖';
  if (lower.includes('map')) return '🗺️';
  if (lower.includes('shield')) return '🛡️';
  if (lower.includes('coin') || lower.includes('gold')) return '🪙';
  return '📦';
}
