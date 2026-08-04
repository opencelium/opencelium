// Mirrors the backend's application.yml token config (see systemConfig entity):
// `opencelium.token.activity-time` (idle timeout) and `opencelium.token.expiration-time`
// (absolute session cap). Keep these in sync if the backend config changes.
export const SESSION_ACTIVITY_TIMEOUT_SEC = 18000 // 5h — logged out after this long with no activity
export const SESSION_EXPIRATION_SEC = 86400 // 24h — logged out this long after login, active or not

const SESSION_STARTED_KEY = 'oc_auth_session_started'
const LAST_ACTIVITY_KEY = 'oc_auth_last_activity'

// localStorage (not sessionStorage) so activity in any tab resets the idle
// clock for every tab, and the absolute cap is measured from a single login.

export function markSessionStarted(now: number = Date.now()): void {
    localStorage.setItem(SESSION_STARTED_KEY, String(now))
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
}

export function recordActivity(now: number = Date.now()): void {
    // Only meaningful once a session has actually started — avoids resurrecting
    // timing keys (and thus a false "expired" read) after logout.
    if (!localStorage.getItem(SESSION_STARTED_KEY)) return
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
}

export function clearSessionTiming(): void {
    localStorage.removeItem(SESSION_STARTED_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)
}

export function isSessionExpired(now: number = Date.now()): boolean {
    const startedAt = Number(localStorage.getItem(SESSION_STARTED_KEY))
    const lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY))
    // No timing recorded (pre-upgrade session, or already cleared) — let the
    // normal token-validation path decide instead of forcing a false logout.
    if (!startedAt || !lastActivityAt) return false

    if (now - lastActivityAt > SESSION_ACTIVITY_TIMEOUT_SEC * 1000) return true
    if (now - startedAt > SESSION_EXPIRATION_SEC * 1000) return true
    return false
}
