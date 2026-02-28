import { DEFAULT_SKIN, DEFAULT_SKIN_ID } from './defaults';
import { SKIN_REGISTRY } from './registry';
import { DeepPartial, SkinConfig } from './types';

interface ResolveSkinInput {
  /**
   * The skin ID to activate. Pass `adminOverride || campaign.skin_id || null`.
   * Admin override takes priority; callers are responsible for combining them.
   */
  forcedSkinId?: string | null;
}

export interface ResolvedSkin {
  skinId: string;
  config: SkinConfig;
}

export interface SkinOption {
  id: string;
  displayName: string;
}

/** Type guard — true for plain objects, false for arrays and primitives. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively merge a patch into a base object.
 * Plain objects are merged; any other value (string, number, array) is replaced.
 * Undefined patch values are skipped (they do not erase the base value).
 */
function deepMerge<T>(base: T, patch?: DeepPartial<T>): T {
  if (!patch) return base;

  const merged = { ...(base as object) } as T;
  for (const key of Object.keys(patch as object) as Array<keyof T>) {
    const patchValue = patch[key];
    if (patchValue === undefined) continue;

    const baseValue = merged[key];
    if (isRecord(baseValue) && isRecord(patchValue)) {
      merged[key] = deepMerge(baseValue, patchValue as DeepPartial<typeof baseValue>) as T[keyof T];
      continue;
    }

    merged[key] = patchValue as T[keyof T];
  }
  return merged;
}

/**
 * Resolve the active skin config from a skin ID.
 *
 * Priority order:
 *   1. forcedSkinId — admin localStorage override OR the active campaign's skin_id
 *      (the caller combines these: `adminOverride || campaign.skin_id || null`)
 *   2. DEFAULT_SKIN — used when forcedSkinId is null or not found in the registry
 *
 * The returned config is always a fully-populated SkinConfig (never partial),
 * produced by deep-merging the registry patch onto DEFAULT_SKIN.
 */
export function resolveSkin(input: ResolveSkinInput): ResolvedSkin {
  const { forcedSkinId = null } = input;
  const candidateSkinId = forcedSkinId || DEFAULT_SKIN_ID;
  const patch = SKIN_REGISTRY[candidateSkinId];

  if (!patch) {
    if (candidateSkinId !== DEFAULT_SKIN_ID && process.env.NODE_ENV !== 'production') {
      console.warn(`[skins] Unknown skin "${candidateSkinId}", falling back to "${DEFAULT_SKIN_ID}".`);
    }
    return {
      skinId: DEFAULT_SKIN_ID,
      config: DEFAULT_SKIN,
    };
  }

  const merged = deepMerge(DEFAULT_SKIN, patch as DeepPartial<SkinConfig>);
  return {
    skinId: candidateSkinId,
    config: {
      ...merged,
      id: candidateSkinId,
      displayName: patch.displayName || merged.displayName,
    },
  };
}

/** Return all registered skins as { id, displayName } pairs for use in admin UI and terminal commands. */
export function listAvailableSkins(): SkinOption[] {
  const ids = new Set<string>([DEFAULT_SKIN_ID, ...Object.keys(SKIN_REGISTRY)]);
  return Array.from(ids).map((id) => {
    const patch = SKIN_REGISTRY[id] as DeepPartial<SkinConfig> | undefined;
    return {
      id,
      displayName: patch?.displayName || (id === DEFAULT_SKIN_ID ? DEFAULT_SKIN.displayName : id),
    };
  });
}
