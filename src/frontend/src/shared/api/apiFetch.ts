import { store } from '@app/store/store'
import { selectAccessToken } from '@entities/auth/model/authSelectors'

type ApiFetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string
}

export async function apiFetch<T = unknown>(
    path: string,
    { method = 'GET', body, token }: ApiFetchOptions = {}
): Promise<{ data: T; headers: Headers }> {
    const baseUrl = (import.meta.env.VITE_API_URL as string) ?? ''
    const accessToken = token ?? selectAccessToken(store.getState())
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
    const res = await fetch(`${baseUrl}${path}`, {
        method,
        credentials: 'include',
        headers,
        ...(body !== undefined && { body: JSON.stringify(body) }),
    })

    if (!res.ok) {
        const message = await res.text().catch(() => res.statusText)
        throw new Error(message || `Request failed with status ${res.status}`)
    }

    const data = res.status === 204 ? (null as T) : (await res.json()) as T
    return { data, headers: res.headers }
}
