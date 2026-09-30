import { useGetSyncStatusQuery } from '@entities/subscription/api/subscriptionApi'
import type { SyncStatus } from '@entities/subscription/model/types'

/** The per-service switches `/sync-history/status` reports under the master `active`. */
export type OnlineSyncScope = 'invoker' | 'template'

/**
 * `active` is the master switch (`online_services.active` in application.yml); each
 * service carries its own flag underneath it. A scoped question therefore needs both:
 * a service is only reachable while the master switch is on.
 */
export function resolveSyncActive(
    status: SyncStatus | undefined,
    scope?: OnlineSyncScope,
): boolean {
    if (!status?.active) return false
    if (!scope) return true

    switch (scope) {
        case 'invoker':
            return status.invoker_sync?.active === true
        case 'template':
            return status.template_sync?.active === true
        default: {
            const _exhaustive: never = scope
            return _exhaustive
        }
    }
}

/**
 * Whether the backend is configured to talk to the service portal — omit `scope` for
 * the master switch alone, pass one to also require that service's own flag.
 */
export function useOnlineSyncStatus(scope?: OnlineSyncScope): {
    isActive: boolean
    isLoading: boolean
} {
    const { data, isLoading } = useGetSyncStatusQuery()
    return { isActive: resolveSyncActive(data, scope), isLoading }
}
