/**
 * Browser connectivity, as a framework-free store so non-React callers (command
 * executors, api layer) can read it too.
 *
 * `navigator.onLine` answers "is there a network interface", not "is the internet
 * reachable" — a captive portal or a dead uplink still reads as online. It is used
 * here deliberately: it is the only signal available without issuing traffic, and it
 * is authoritative in the direction that matters for gating, since `false` means
 * nothing can go out. Treat `true` as "not known to be offline".
 */

type Listener = () => void

const listeners = new Set<Listener>()

const readNavigator = (): boolean =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false

let isOnline = readNavigator()

function handleChange(): void {
    const next = readNavigator()
    if (next === isOnline) return
    isOnline = next
    listeners.forEach((listener) => listener())
}

function subscribe(listener: Listener): () => void {
    // Window listeners are bound only while something is watching, so importing this
    // module stays side-effect free.
    if (listeners.size === 0 && typeof window !== 'undefined') {
        window.addEventListener('online', handleChange)
        window.addEventListener('offline', handleChange)
        handleChange()
    }
    listeners.add(listener)

    return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && typeof window !== 'undefined') {
            window.removeEventListener('online', handleChange)
            window.removeEventListener('offline', handleChange)
        }
    }
}

export const onlineStatus = {
    subscribe,
    /** Stable primitive — safe as a `useSyncExternalStore` snapshot. */
    getSnapshot: (): boolean => isOnline,
    /** Re-reads `navigator.onLine` and notifies subscribers if it moved. */
    refresh: handleChange,
}
