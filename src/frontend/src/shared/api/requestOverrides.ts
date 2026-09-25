/**
 * A registry of canned responses, consulted by `baseQuery` before it reaches the
 * network. Exists for the workflow tutorial, which teaches the real editor on
 * invented systems: seeding the query cache cannot work, because `baseApi` sets
 * `refetchOnMountOrArgChange: true` and every mount revalidates over the fixtures.
 * Intercepting the request itself is the only place that reliably wins.
 *
 * Registrations live here rather than in the feature so the dependency runs
 * features -> shared, and so there is one obvious place to look when a response
 * does not match the server.
 */
type OverrideMap = Map<string, unknown>

/**
 * A request as the handler sees it: the path with the base URL already stripped,
 * the verb upper-cased, and the parsed body for a write.
 */
export type OverrideRequest = {
    path: string
    method: string
    body?: unknown
}

/**
 * Answers requests the static map cannot: paths that carry an id, and writes whose
 * result depends on what was written. Returning `undefined` declines, and the
 * request goes to the server untouched.
 *
 * One handler at a time, because only one sandbox can be running: the tutorial's
 * schedules are the sole user, and a second registration would silently replace it
 * rather than compete with it.
 */
export type OverrideHandler = (request: OverrideRequest) => unknown

const overrides: OverrideMap = new Map()
let handler: OverrideHandler | null = null

/** Normalises to a leading-slash path so callers can pass either form. */
const key = (url: string) => (url.startsWith('/') ? url : `/${url}`)

export function setRequestOverrides(entries: Record<string, unknown>) {
    for (const [url, body] of Object.entries(entries)) overrides.set(key(url), body)
}

export function setRequestOverrideHandler(next: OverrideHandler | null) {
    handler = next
}

/** Removes both registrations, so one call is enough to give the real API back. */
export function clearRequestOverrides() {
    overrides.clear()
    handler = null
}

export function hasRequestOverrides() {
    return overrides.size > 0 || handler !== null
}

/**
 * The canned body for a request, or undefined to let it through. The map is exact
 * path matches on GET only, so a query string or a different verb falls through —
 * anything more conditional than that is the handler's business.
 */
export function findRequestOverride(url: string, method?: string, body?: unknown): unknown {
    if (overrides.size === 0 && !handler) return undefined

    const path = key(url.replace(/^https?:\/\/[^/]+/i, ''))
    const verb = (method ?? 'GET').toUpperCase()

    if (verb === 'GET') {
        const mapped = overrides.get(path)
        if (mapped !== undefined) return mapped
    }

    return handler?.({ path, method: verb, body })
}
