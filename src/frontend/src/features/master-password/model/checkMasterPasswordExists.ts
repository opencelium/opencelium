import { apiExecutor } from '@shared/api/apiExecutor'

const isApiExecutorError = (response: unknown): boolean =>
    !!response && typeof response === 'object' && ('status' in response || 'error' in response)

/**
 * Whether a master password is configured on the backend at all — routed through
 * apiExecutor (not the RTK Query hook) so it works even when called from a context
 * bound to a different redux store (e.g. the workflow editor's isolated legacy
 * <Provider> — see GraphQlBodyEditor), where a hook-bound dispatch would silently
 * target the wrong store. Fail-safe: on an API error, assumes one exists rather
 * than accidentally exposing gated content.
 */
export async function checkMasterPasswordExistsRaw(): Promise<boolean> {
    const response = await apiExecutor({
        url: '/connector/master-password/status/exist',
        method: 'GET',
        options: { ignoreError: true },
    })
    return isApiExecutorError(response) ? true : Boolean(response)
}
