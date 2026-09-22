import { useSyncExternalStore } from 'react'
import { onlineStatus } from '@shared/network/onlineStatus'

/**
 * `true` while the browser reports a network connection. See `onlineStatus` for what
 * that guarantee is worth — `false` is the trustworthy half.
 */
export function useOnlineStatus(): boolean {
    return useSyncExternalStore(onlineStatus.subscribe, onlineStatus.getSnapshot, () => true)
}
