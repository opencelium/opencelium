import { useEffect } from 'react'
import { useAppDispatch } from '@shared/lib/storeHooks'
import { authActions } from '@entities/auth/model/authSlice'
import { useAuth } from '@features/auth/useAuth'
import { isSessionExpired, recordActivity } from '@features/auth/session/sessionTiming'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'wheel', 'touchstart'] as const
// Avoid hammering localStorage on every event — a coarse resolution is plenty
// for a multi-hour idle window.
const ACTIVITY_WRITE_THROTTLE_MS = 30_000
const CHECK_INTERVAL_MS = 15_000
const SESSION_CHANNEL_NAME = 'session-events'

/** Forces logout (this tab and every other open tab) once the client-side idle
 * or absolute session timeout elapses — see sessionTiming for the thresholds. */
export function SessionExpiryWatcher() {
    const dispatch = useAppDispatch()
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) return

        let lastWrite = 0
        const onActivity = () => {
            const now = Date.now()
            if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return
            lastWrite = now
            recordActivity(now)
        }

        const checkExpiry = () => {
            if (!isSessionExpired()) return
            dispatch(authActions.clearSession())
            try {
                const channel = new BroadcastChannel(SESSION_CHANNEL_NAME)
                channel.postMessage({ type: 'SESSION_UPDATE', payload: { action: 'LOGOUT' } })
                channel.close()
            } catch {
                // BroadcastChannel is unsupported in some embedded webviews — best effort only.
            }
        }

        ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, onActivity, { passive: true }))
        document.addEventListener('visibilitychange', checkExpiry)
        const interval = window.setInterval(checkExpiry, CHECK_INTERVAL_MS)
        // Catch a tab that sat backgrounded (interval throttled) longer than either window.
        checkExpiry()

        return () => {
            ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, onActivity))
            document.removeEventListener('visibilitychange', checkExpiry)
            window.clearInterval(interval)
        }
    }, [isAuthenticated, dispatch])

    return null
}
