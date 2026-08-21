/**
 * Imperative bridge to the ThemeProvider for non-React call sites
 * (command-palette `execute` runs outside the component tree).
 * Same pattern as setUserPolicyContext for the policy engine.
 */
type ThemeSetter = (id: string) => void

let setter: ThemeSetter | null = null

export function registerThemeSetter(fn: ThemeSetter): () => void {
    setter = fn
    return () => {
        if (setter === fn) setter = null
    }
}

/** Returns false when no provider is mounted yet. */
export function setGlobalTheme(id: string): boolean {
    if (!setter) return false
    setter(id)
    return true
}

type ThemeRefresher = () => void

let refresher: ThemeRefresher | null = null

export function registerThemeRefresher(fn: ThemeRefresher): () => void {
    refresher = fn
    return () => {
        if (refresher === fn) refresher = null
    }
}

/**
 * Re-renders the active theme without changing the stored id — for a definition that
 * was re-registered under the same id (org theme arriving from the server) or removed,
 * which the id alone can't signal. Returns false when no provider is mounted yet.
 */
export function refreshGlobalTheme(): boolean {
    if (!refresher) return false
    refresher()
    return true
}
