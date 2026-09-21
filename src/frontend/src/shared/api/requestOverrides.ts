/**
 * A registry of canned GET responses, consulted by `baseQuery` before it reaches the
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

const overrides: OverrideMap = new Map()

/** Normalises to a leading-slash path so callers can pass either form. */
const key = (url: string) => (url.startsWith('/') ? url : `/${url}`)

export function setRequestOverrides(entries: Record<string, unknown>) {
    for (const [url, body] of Object.entries(entries)) overrides.set(key(url), body)
}

export function clearRequestOverrides() {
    overrides.clear()
}

export function hasRequestOverrides() {
    return overrides.size > 0
}

/**
 * The canned body for a request, or undefined to let it through. Only exact path
 * matches on the resolved URL, so a query string or a different verb falls through
 * to the server untouched.
 */
export function findRequestOverride(url: string, method?: string): unknown {
    if (overrides.size === 0) return undefined
    if (method && method.toUpperCase() !== 'GET') return undefined

    const path = url.replace(/^https?:\/\/[^/]+/i, '')
    return overrides.get(key(path))
}
