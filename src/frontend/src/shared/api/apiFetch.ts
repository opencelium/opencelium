import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'

type ApiFetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string
    timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

export const API_TIMEOUT_ERROR_NAME = 'ApiTimeoutError'

function buildTimeoutError(path: string, timeoutMs: number): Error {
    const err = new Error(`Request to ${path} timed out after ${timeoutMs}ms`)
    err.name = API_TIMEOUT_ERROR_NAME
    return err
}

export async function apiFetch<T = unknown>(
    path: string,
    { method = 'GET', body, token, timeoutMs = DEFAULT_TIMEOUT_MS }: ApiFetchOptions = {}
): Promise<{ data: T; headers: Headers }> {
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
    const accessToken = token ?? selectAccessToken(store.getState())
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    let res: Response
    try {
        res = await fetch(`${baseUrl}${path}`, {
            method,
            credentials: 'include',
            headers,
            signal: controller.signal,
            ...(body !== undefined && { body: JSON.stringify(body) }),
        })
    } catch (e) {
        if ((e as Error)?.name === 'AbortError') {
            throw buildTimeoutError(path, timeoutMs)
        }
        throw e
    } finally {
        clearTimeout(timer)
    }

    if (!res.ok) {
        const message = await res.text().catch(() => res.statusText)
        throw new Error(message || `Request failed with status ${res.status}`)
    }

    const data = res.status === 204 ? (null as T) : (await res.json()) as T
    return { data, headers: res.headers }
}
