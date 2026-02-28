const ADMIN_SKIN_OVERRIDE_KEY = 'terminalAdminSkinOverride';

export function readAdminSkinOverride(): string | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(ADMIN_SKIN_OVERRIDE_KEY);
  return value && value.trim() ? value.trim() : null;
}

export function writeAdminSkinOverride(skinId: string | null): void {
  if (typeof window === 'undefined') return;
  if (!skinId) {
    window.localStorage.removeItem(ADMIN_SKIN_OVERRIDE_KEY);
    return;
  }
  window.localStorage.setItem(ADMIN_SKIN_OVERRIDE_KEY, skinId);
}

export function getAdminSkinOverrideStorageKey(): string {
  return ADMIN_SKIN_OVERRIDE_KEY;
}
