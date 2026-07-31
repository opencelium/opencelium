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
