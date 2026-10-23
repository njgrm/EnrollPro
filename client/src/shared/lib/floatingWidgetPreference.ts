export const HIDE_TIME_MACHINE_FLOATING_ICON_STORAGE_KEY =
  "enrollpro_hide_time_machine_floating_icon";

/**
 * Reads the persisted preference for whether the Time Machine floating icon is hidden.
 * Checks localStorage first, then falls back to persistent cookies to ensure survival
 * across full localStorage wipes or logouts.
 */
export function readStoredHideFloatingIcon(): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const localVal = window.localStorage.getItem(
      HIDE_TIME_MACHINE_FLOATING_ICON_STORAGE_KEY,
    );
    if (localVal !== null) {
      return localVal === "true";
    }
  } catch {
    // Ignore localStorage access failures
  }

  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${HIDE_TIME_MACHINE_FLOATING_ICON_STORAGE_KEY}=([^;]*)`),
    );
    if (match) {
      return match[1] === "true";
    }
  } catch {
    // Ignore cookie access failures
  }

  return null;
}

/**
 * Writes the preference to both localStorage and a 1-year persistent cookie.
 */
export function writeStoredHideFloatingIcon(hide: boolean): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      HIDE_TIME_MACHINE_FLOATING_ICON_STORAGE_KEY,
      String(hide),
    );
  } catch {
    // Ignore localStorage access failures
  }

  try {
    document.cookie = `${HIDE_TIME_MACHINE_FLOATING_ICON_STORAGE_KEY}=${hide}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Ignore cookie access failures
  }
}
