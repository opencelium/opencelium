import {store} from '@app/store/store'
import {selectAccessToken} from '@entities/auth/model/authSelectors'

type ApiFetchOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    body?: unknown
    token?: string
    /** ms before the request is aborted. Pass null to disable. Default 30_000. */
    timeoutMs?: number | null
    /** External cancellation signal — aborts here surface as the original AbortError, not as a timeout. */
    signal?: AbortSignal
    /** Extra request headers; override Content-Type / Authorization when present. */
    headers?: Record<string, string>
}

const DEFAULT_TIMEOUT_MS = 30_000

export const API_TIMEOUT_ERROR_NAME = 'ApiTimeoutError'

export class ApiFetchError extends Error {
    readonly status: number
    readonly code?: string
    readonly body?: unknown

    constructor(message: string, init: {status: number; code?: string; body?: unknown}) {
        super(message)
        this.name = 'ApiFetchError'
        this.status = init.status
        this.code = init.code
        this.body = init.body
    }
}

function buildTimeoutError(path: string, timeoutMs: number): Error {
    const err = new Error(`Request to ${path} timed out after ${timeoutMs}ms`)
    err.name = API_TIMEOUT_ERROR_NAME
    return err
}

function resolveUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path
    const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function isStructuredBody(body: unknown): body is BodyInit {
    if (typeof FormData !== 'undefined' && body instanceof FormData) return true
    if (typeof Blob !== 'undefined' && body instanceof Blob) return true
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return true
    return false
}

async function parseResponseBody(res: Response): Promise<unknown> {
    if (res.status === 204) return null
    const text = await res.text()
    if (!text) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) return text
    try {
        return JSON.parse(text)
    } catch {
        return text
    }
}

function extractErrorMessage(body: unknown): string | undefined {
    if (typeof body === 'string') return body
    if (body && typeof body === 'object') {
        const m = (body as {message?: unknown}).message
        if (typeof m === 'string') return m
    }
    return undefined
}

function extractErrorCode(body: unknown): string | undefined {
    if (body && typeof body === 'object') {
        const c = (body as {code?: unknown}).code
        if (typeof c === 'string') return c
    }
    return undefined
}

export async function apiFetchWithHeaders<T = unknown>(
    path: string,
    {
        method = 'GET',
        body,
        token,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        signal: externalSignal,
        headers: extraHeaders,
    }: ApiFetchOptions = {},
): Promise<{data: T | null; headers: Headers; status: number}> {
    const accessToken = token ?? selectAccessToken(store.getState())

    const requestHeaders: Record<string, string> = {}
    if (body !== undefined && !isStructuredBody(body)) {
        requestHeaders['Content-Type'] = 'application/json'
    }
    if (accessToken) requestHeaders['Authorization'] = `Bearer ${accessToken}`
    if (extraHeaders) Object.assign(requestHeaders, extraHeaders)

    const controller = new AbortController()
    const cleanup: Array<() => void> = []
    let timedOut = false

    if (timeoutMs !== null) {
        const ms = Math.max(1, timeoutMs)
        const timer = setTimeout(() => {
            timedOut = true
            controller.abort()
        }, ms)
        cleanup.push(() => clearTimeout(timer))
    }

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort()
        } else {
            const onAbort = () => controller.abort()
            externalSignal.addEventListener('abort', onAbort)
            cleanup.push(() => externalSignal.removeEventListener('abort', onAbort))
        }
    }

    const requestBody: BodyInit | undefined =
        body === undefined
            ? undefined
            : isStructuredBody(body)
                ? body
                : JSON.stringify(body)

    let res: Response
    try {
        res = await fetch(resolveUrl(path), {
            method,
            credentials: 'include',
            headers: requestHeaders,
            signal: controller.signal,
            ...(requestBody !== undefined && {body: requestBody}),
        })
    } catch (e) {
        if ((e as Error)?.name === 'AbortError' && timedOut) {
            throw buildTimeoutError(path, timeoutMs ?? DEFAULT_TIMEOUT_MS)
        }
        throw e
    } finally {
        cleanup.forEach((fn) => fn())
    }

    if (!res.ok) {
        const errorBody = await parseResponseBody(res).catch(() => null)
        const message =
            extractErrorMessage(errorBody) ?? res.statusText ?? `Request failed with status ${res.status}`
        throw new ApiFetchError(message, {
            status: res.status,
            code: extractErrorCode(errorBody),
            body: errorBody,
        })
    }

    const data = (await parseResponseBody(res)) as T | null
    return {data, headers: res.headers, status: res.status}
}
