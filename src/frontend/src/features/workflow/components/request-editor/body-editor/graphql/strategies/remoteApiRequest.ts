import { apiExecutor } from '@shared/api/apiExecutor'

export type RemoteApiRequestPayload = {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    header?: Record<string, string>
    body?: Record<string, unknown>
    sslOn: boolean
}

export type RemoteApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: unknown }

const isApiExecutorError = (response: unknown): boolean =>
    !!response && typeof response === 'object' && ('status' in response || 'error' in response)

export async function remoteApiRequest<T = unknown>(payload: RemoteApiRequestPayload): Promise<RemoteApiResult<T>> {
    const response: unknown = await apiExecutor({
        url: '/connection/remoteapi',
        method: 'POST',
        body: payload,
        options: { ignoreError: true },
    })

    if (isApiExecutorError(response)) {
        return { ok: false, error: response }
    }

    return { ok: true, data: response as T }
}
