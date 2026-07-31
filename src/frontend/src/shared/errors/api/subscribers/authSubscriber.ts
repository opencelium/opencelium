import { errorBus } from '../errorBus'
import { store } from '@app/store/store'
import { authActions } from '@entities/auth/model/authSlice'
import { clearAuthTokens } from '@features/auth/strategies/PasswordStrategy'

const SESSION_CHANNEL_NAME = 'session-events'

export function initApiAuthErrorSubscriber() {
    return errorBus.subscribe((error) => {
        // 401 and 403 both indicate a dead session in this backend (Spring's
        // "Full authentication is required to access this resource" comes back
        // as 403).
        if (error.type !== 'UNAUTHORIZED' && error.type !== 'FORBIDDEN') return

        // Already unauthenticated (e.g. a 401 fired during the initial refresh
        // on an open /login tab) — no need to dispatch or broadcast again.
        if (store.getState().auth.status === 'unauthenticated') return

        clearAuthTokens()
        store.dispatch(authActions.clearSession())

        try {
            const channel = new BroadcastChannel(SESSION_CHANNEL_NAME)
            channel.postMessage({ type: 'SESSION_UPDATE', payload: { action: 'LOGOUT' } })
            channel.close()
        } catch {
            // BroadcastChannel is unsupported in some embedded webviews — best effort only.
        }
    })
}
