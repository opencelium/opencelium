import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { clearCustomThemeSeeds } from '@shared/theme/themeStorage'

/**
 * A personal, browser-local theme. Nothing creates one any more — the seed editor is
 * admin-only and publishes to the system theme instead — so what is left here serves
 * browsers that still carry one from before: `themeRegistry` re-registers it from
 * localStorage at module load, and these two let the user get rid of it.
 */
export const CUSTOM_THEME_IDS = {
    light: 'custom-light',
    dark: 'custom-dark',
} as const

/** Removes the stored seeds and unregisters both custom theme variants. */
export function removeCustomTheme() {
    clearCustomThemeSeeds()
    themeRegistry.unregister(CUSTOM_THEME_IDS.light)
    themeRegistry.unregister(CUSTOM_THEME_IDS.dark)
}

export const hasCustomTheme = () => themeRegistry.has(CUSTOM_THEME_IDS.light)
