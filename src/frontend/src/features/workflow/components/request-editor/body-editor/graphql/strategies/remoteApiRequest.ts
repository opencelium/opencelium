import { apiExecutor } from '@shared/api/apiExecutor'
import { isApiExecutorError } from '../graphQlBodyEditor.utils'

export type RemoteApiRequestPayload = {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    header?: Record<string, string>
    body?: Record<string, unknown>
    trustAnyCertificate: boolean
}

export type RemoteApiResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: unknown }

export async function remoteApiRequest<T = unknown>({ trustAnyCertificate, ...payload }: RemoteApiRequestPayload): Promise<RemoteApiResult<T>> {
    const response: unknown = await apiExecutor({
        url: '/connection/remoteapi',
        method: 'POST',
        // /connection/remoteapi reads sslOn as "validate the certificate" and inverts it
        // before building the RestTemplate, unlike Connector.sslCert which means "trust any".
        body: { ...payload, sslOn: !trustAnyCertificate },
        options: { ignoreError: true },
    })

    if (isApiExecutorError(response)) {
        return { ok: false, error: response }
    }

    return { ok: true, data: response as T }
}
