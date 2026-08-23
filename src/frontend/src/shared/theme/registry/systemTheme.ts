import { createCustomPalette, type CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { refreshGlobalTheme } from '@shared/theme/themeController'
import { clearSystemThemeSeeds, storeSystemThemeSeeds } from '@shared/theme/themeStorage'

export const SYSTEM_THEME_IDS = {
    light: 'system-light',
    dark: 'system-dark',
} as const

export const isSystemThemeId = (id: string) =>
    id === SYSTEM_THEME_IDS.light || id === SYSTEM_THEME_IDS.dark

export const hasSystemTheme = () => themeRegistry.has(SYSTEM_THEME_IDS.light)

/**
 * Caches the org-wide seeds and (re)registers both variants as the registry default,
 * so a user without an explicit theme choice follows the org brand. An explicit
 * choice — including a personal custom theme — still wins, which is why an admin
 * with one won't see their own save take effect on screen.
 *
 * The same registration runs at module load from the cache (themeRegistry.ts); this
 * path covers the fetch that brings in a change made elsewhere.
 */
export function applySystemThemeSeeds(seeds: CustomThemeSeeds) {
    storeSystemThemeSeeds(seeds)
    const sidebar = seeds.sidebar ? { bg: seeds.sidebar } : undefined
    themeRegistry.register({
        id: SYSTEM_THEME_IDS.light,
        label: 'System Light',
        family: 'system',
        mode: 'light',
        palette: createCustomPalette(seeds, 'light'),
        sidebar,
    })
    themeRegistry.register({
        id: SYSTEM_THEME_IDS.dark,
        label: 'System Dark',
        family: 'system',
        mode: 'dark',
        palette: createCustomPalette(seeds, 'dark'),
        sidebar,
    })
    themeRegistry.setDefault(SYSTEM_THEME_IDS.light)
    refreshGlobalTheme()
}

/** Drops the org-wide theme so every client falls back to the built-in default. */
export function removeSystemTheme() {
    clearSystemThemeSeeds()
    themeRegistry.unregister(SYSTEM_THEME_IDS.light)
    themeRegistry.unregister(SYSTEM_THEME_IDS.dark)
    refreshGlobalTheme()
}
