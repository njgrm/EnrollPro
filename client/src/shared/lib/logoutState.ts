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
