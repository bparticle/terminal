/**
 * Single source of truth for the app version displayed in the UI.
 * Keep in sync with the root package.json version.
 *
 * Versioning follows SemVer (https://semver.org):
 *   MAJOR.MINOR.PATCH[-prerelease]
 *
 * Pre-1.0 convention:
 *   0.MINOR = beta feature milestones (bump when a roadmap feature ships)
 *   PATCH   = bug fixes and small improvements within a milestone
 *
 * When bumping, update:
 *   1. This file
 *   2. Root package.json, frontend/package.json, backend/package.json
 *   3. CHANGELOG.md (add a new entry at the top of the Unreleased section → move to versioned heading)
 */
export const APP_VERSION = '0.4.0-beta';
