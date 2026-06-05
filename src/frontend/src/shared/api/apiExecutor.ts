import { genericApi } from '@/shared/api/genericApi'
import { store } from '@app/store/store.ts'
import { selectAccessToken } from '@entities/auth/model/authSelectors'

export type ApiExecutorOptions = {
    ignoreError?: boolean
    headers?: Record<string, string>
    /**
     * Override response handling.
     *  - 'arraybuffer' decodes binary (e.g. application/octet-stream) as text.
     *  - 'blob' returns the raw `Blob` for browser-side downloads.
     */
    responseType?: 'arraybuffer' | 'blob'
    /** Text encoding used when responseType is 'arraybuffer'. Defaults to 'utf-8'. */
    encoding?: string
}

type ApiExecutorArgs = {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: any
    options?: ApiExecutorOptions
}

function resolveUrl(url: string): string {
    if (url.startsWith('http')) return url
    const baseUrl = import.meta.env.VITE_API_URL as string
    const path = url.startsWith('./') ? url.slice(1) : url.startsWith('/') ? url : `/${url}`
    return `${baseUrl}${path}`
}

function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
    const token = selectAccessToken(store.getState())
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extra ?? {}),
    }
}

async function fetchBinary({ url, method, body, options }: ApiExecutorArgs): Promise<Response> {
    const res = await fetch(resolveUrl(url), {
        method,
        headers: buildAuthHeaders(options?.headers),
        credentials: 'include',
        ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    return res
}

async function fetchAsArrayBuffer(args: ApiExecutorArgs): Promise<string> {
    const res = await fetchBinary(args)
    return new TextDecoder(args.options?.encoding ?? 'utf-8').decode(await res.arrayBuffer())
}

async function fetchAsBlob(args: ApiExecutorArgs): Promise<Blob> {
    const res = await fetchBinary(args)
    return res.blob()
}

export async function apiExecutor({ url, method, body, options }: ApiExecutorArgs): Promise<any> {
    if (options?.responseType === 'arraybuffer') {
        return fetchAsArrayBuffer({ url, method, body, options })
    }
    if (options?.responseType === 'blob') {
        return fetchAsBlob({ url, method, body, options })
    }

    const result = await store.dispatch(
        genericApi.endpoints.generalRequest.initiate({
            url,
            method,
            body,
            options,
        }),
    )

    if ('error' in result) {
        return result.error
    }

    return result.data
}
