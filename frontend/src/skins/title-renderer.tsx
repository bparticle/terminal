'use client';

import { useEffect, useMemo, useState } from 'react';
import ScanlineTitle from '@/app/terminal/components/ScanlineTitle';
import { SkinTitleConfig } from './types';

interface SkinTitleRendererProps {
  title: SkinTitleConfig;
}

export default function SkinTitleRenderer({ title }: SkinTitleRendererProps) {
  const [assetFailed, setAssetFailed] = useState(false);
  const titleText = title.text.trim() || 'TERMINAL ADVENTURE';

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
      <div className="skin-title-text" role="img" aria-label="Campaign title">
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
