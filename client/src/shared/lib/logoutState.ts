/**
 * Global synchronous in-memory flag indicating that a logout is currently in progress.
 * Used to immediately suppress skeleton loading placeholders across layouts, pages,
 * and router fallbacks while redirecting to the login screen.
 */
let _isLoggingOut = false;

export function setLoggingOut(loggingOut = true): void {
  _isLoggingOut = loggingOut;
}

export function isLoggingOut(): boolean {
  return _isLoggingOut;
}

/**
 * Safely clears authenticated session storage while preserving browser-level user preferences
 * such as the Remember Me credentials, UI settings, and the Time Machine floating icon visibility.
 */
export function clearClientSessionPreservingPreferences(): void {
  if (typeof window === "undefined") return;

  const PRESERVED_KEYS = [
    "rememberedEmployeeId",
    "rememberedAccountName",
    "rememberedLearnerLrn",
    "enrollpro-settings",
    "enrollpro_hide_time_machine_floating_icon",
    "theme_cache",
    "teacherSidebarCollapsed",
    "registrarSidebarCollapsed",
    "adminSidebarCollapsed",
    "adminDropdownState",
  ];

  try {
    const preserved: Record<string, string> = {};
    for (const key of PRESERVED_KEYS) {
      const val = window.localStorage.getItem(key);
      if (val !== null) {
        preserved[key] = val;
      }
    }

    window.localStorage.clear();

    for (const [key, val] of Object.entries(preserved)) {
      window.localStorage.setItem(key, val);
    }
  } catch {
    // Ignore storage errors if localStorage is restricted
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // Ignore
  }
}
