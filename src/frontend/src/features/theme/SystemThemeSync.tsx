import { useEffect } from 'react'
import { useGetSystemSettingQuery } from '@entities/systemSetting/api/systemSettingApi'
import { useAuth } from '@features/auth/useAuth'
import { isValidSeeds } from '@shared/theme/palette/customPalette'
import { applySystemThemeSeeds, removeSystemTheme } from '@shared/theme/registry/systemTheme'
import { readSystemThemeSeeds } from '@shared/theme/themeStorage'

const seedsEqual = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Keeps the org-wide theme (`theme_colors`) in step with the server once a session
 * exists — the endpoint needs a token, so this can't run on the login screen. The
 * previous answer is cached in localStorage and registered at module load, which is
 * what brands the login screen and the first paint after a reload.
 *
 * A 404 is the documented "never saved / just deleted" state and clears the cache, so
 * an admin's reset reaches every client. Any other failure (offline, 5xx) deliberately
 * leaves the cached theme in place rather than flipping everyone back to the default.
 */
export function SystemThemeSync() {
    const { isAuthenticated } = useAuth()
    const { data, error } = useGetSystemSettingQuery('theme_colors', { skip: !isAuthenticated })

    useEffect(() => {
        if (!data) return
        if (!isValidSeeds(data.value)) {
            removeSystemTheme()
            return
        }
        // Already registered from the cache at module load — re-registering would
        // rebuild both palettes and re-render the tree for nothing.
        if (seedsEqual(readSystemThemeSeeds(), data.value)) return
        applySystemThemeSeeds(data.value)
    }, [data])

    useEffect(() => {
        if (error && 'status' in error && error.status === 404) removeSystemTheme()
    }, [error])

    return null
}
