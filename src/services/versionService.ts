const LAST_SEEN_VERSION_KEY = 'eazyweather_last_seen_version';

interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Get the current application version from package.json
 * This is set at build time by Vite
 */
export function getCurrentVersion(): string {
  // In production, this would be replaced by the build process
  // For now, we'll use a hardcoded version that matches package.json
  return '1.3.1';
}

/**
 * Get the last version the user saw from localStorage
 */
export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the current version as the last seen version
 */
export function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to save last seen version:', error);
  }
}

/**
 * Parse a semantic version string into components
 */
export function parseVersion(version: string): SemanticVersion | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Check if there's any version change (MAJOR, MINOR, or PATCH)
 * Per issue #55: Show on all version changes since patches can fix annoyances
 */
export function hasVersionChanged(oldVersion: string, newVersion: string): boolean {
  const oldVer = parseVersion(oldVersion);
  const newVer = parseVersion(newVersion);

  if (!oldVer || !newVer) return false;

  // Any change counts (MAJOR, MINOR, or PATCH)
  return (
    oldVer.major !== newVer.major ||
    oldVer.minor !== newVer.minor ||
    oldVer.patch !== newVer.patch
  );
}

/**
 * Determine if the "What's New" modal should be shown
 * Returns true if:
 * 1. User has a previous version stored (returning user)
 * 2. Current version is different from last seen version
 */
export function shouldShowWhatsNew(): boolean {
  const currentVersion = getCurrentVersion();
  const lastSeenVersion = getLastSeenVersion();

  // First-time user (no previous version) - don't show
  if (!lastSeenVersion) {
    console.log('First-time user detected - not showing What\'s New modal');
    return false;
  }

  // Returning user - check if version changed
  const shouldShow = hasVersionChanged(lastSeenVersion, currentVersion);

  if (shouldShow) {
    console.log(`Version changed from ${lastSeenVersion} to ${currentVersion} - showing What's New modal`);
  } else {
    console.log(`Version unchanged (${currentVersion}) - not showing What's New modal`);
  }

  return shouldShow;
}

/**
 * Mark the What's New modal as seen for the current version
 */
export function markWhatsNewAsSeen(): void {
  const currentVersion = getCurrentVersion();
  setLastSeenVersion(currentVersion);
  console.log(`What's New modal dismissed - version ${currentVersion} marked as seen`);
}
