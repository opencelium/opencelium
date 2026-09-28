import { store } from '@app/store/store'
import { invokerApi } from '@entities/invoker/api/invokerApi'
import type { InvokerRepositoryDownload } from '@entities/invoker/model/types'
import { subscriptionApi } from '@entities/subscription/api/subscriptionApi'
import { resolveSyncActive } from '@entities/subscription/model/useOnlineSyncStatus'
import { normalizeError } from '@shared/errors/api/normalizeError'
import type { AppError } from '@shared/errors/types'
import { onlineStatus } from '@shared/network/onlineStatus'

const REQUEST = { url: '/invoker/remote', method: 'POST' }

export type InstallInvokersResult =
    | { status: 'done'; result: InvokerRepositoryDownload }
    | { status: 'error'; error: AppError }

const repositoryError = (messageKey: string): AppError => ({
    type: 'NETWORK',
    messageKey: `invokerRepository.${messageKey}`,
})

/**
 * `FETCH_ERROR` means the browser never reached our backend; a 502 is the backend
 * telling us *it* could not reach the repository (`INVOKER_REPOSITORY_UNAVAILABLE`).
 * Both are connectivity problems, but the user fixes them in different places.
 */
export function toInstallInvokersError(error: unknown): AppError {
    const status = (error as { status?: unknown } | null)?.status
    if (status === 'FETCH_ERROR') return repositoryError('serverUnreachable')
    if (status === 502) return repositoryError('unavailable')
    return normalizeError(error, REQUEST)
}

/**
 * Mirrors the onboarding "download from repository" gate: the browser must be online
 * and the install-wide online-services switch must be on. A sync-status lookup that
 * fails is not treated as "disabled" — the backend call below still has the final say.
 */
async function checkOnlineServices(): Promise<AppError | null> {
    onlineStatus.refresh()
    if (!onlineStatus.getSnapshot()) return repositoryError('offline')

    const query = store.dispatch(subscriptionApi.endpoints.getSyncStatus.initiate())
    const status = await query
    query.unsubscribe()
    if (status.data && !resolveSyncActive(status.data)) return repositoryError('syncDisabled')
    return null
}

export async function installInvokersFromRepository(): Promise<InstallInvokersResult> {
    const blocked = await checkOnlineServices()
    if (blocked) return { status: 'error', error: blocked }

    try {
        const result = await store
            .dispatch(invokerApi.endpoints.downloadInvokersFromRepository.initiate())
            .unwrap()
        return { status: 'done', result }
    } catch (error) {
        return { status: 'error', error: toInstallInvokersError(error) }
    }
}
