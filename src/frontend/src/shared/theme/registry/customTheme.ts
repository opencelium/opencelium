import { createCustomPalette, type CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { clearCustomThemeSeeds, storeCustomThemeSeeds } from '@shared/theme/themeStorage'

export const CUSTOM_THEME_IDS = {
    light: 'custom-light',
    dark: 'custom-dark',
} as const

/** Persists the seeds and (re)registers both custom theme variants. */
export function applyCustomThemeSeeds(seeds: CustomThemeSeeds) {
    storeCustomThemeSeeds(seeds)
    themeRegistry.register({
        id: CUSTOM_THEME_IDS.light,
        label: 'Custom Light',
        family: 'custom',
        mode: 'light',
        palette: createCustomPalette(seeds, 'light'),
    })
    themeRegistry.register({
        id: CUSTOM_THEME_IDS.dark,
        label: 'Custom Dark',
        family: 'custom',
        mode: 'dark',
        palette: createCustomPalette(seeds, 'dark'),
    })
}

/** Removes the stored seeds and unregisters both custom theme variants. */
export function removeCustomTheme() {
    clearCustomThemeSeeds()
    themeRegistry.unregister(CUSTOM_THEME_IDS.light)
    themeRegistry.unregister(CUSTOM_THEME_IDS.dark)
}

export const hasCustomTheme = () => themeRegistry.has(CUSTOM_THEME_IDS.light)
