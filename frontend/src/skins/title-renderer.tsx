'use client';

/**
 * Renders the top title area based on the active skin's title config.
 *
 * Fallback chain:
 *   1. mode === 'image' | 'gif' and imageSrc is set  → <img>
 *   2. Image load failure, or mode === 'text'         → styled text (skin-title-text)
 *   3. Everything else (mode === 'animatedCanvas')    → ScanlineTitle canvas
 *
 * The `text` field is used both as the label for mode === 'text' and as the
 * fallback label shown when an image or gif fails to load.
 */

import { useEffect, useMemo, useState } from 'react';
import ScanlineTitle from '@/app/terminal/components/ScanlineTitle';
import { SkinTitleConfig } from './types';

interface SkinTitleRendererProps {
  title: SkinTitleConfig;
}

export default function SkinTitleRenderer({ title }: SkinTitleRendererProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const titleText = title.text.trim() || 'TERMINAL ADVENTURE';

  // Reset failure state whenever the skin switches to a different asset.
  useEffect(() => {
    setAssetFailed(false);
  }, [title.mode, title.imageSrc]);

  const canRenderAsset = useMemo(() => {
    if (assetFailed) return false;
    if (title.mode !== 'image' && title.mode !== 'gif') return false;
    return Boolean(title.imageSrc);
  }, [assetFailed, title.imageSrc, title.mode]);

  if (canRenderAsset) {
    return (
      <img
        className="skin-title-media"
        src={title.imageSrc!}
        alt={title.imageAlt || 'Campaign title'}
        onError={() => setAssetFailed(true)}
      />
    );
  }

  if (title.mode === 'text' || (assetFailed && titleText)) {
    return (
      <div className="skin-title-text">
        {titleText}
      </div>
    );
  }

  return (
    <div className="skin-title-canvas">
      <ScanlineTitle variant={title.animatedVariant} />
    </div>
  );
}
