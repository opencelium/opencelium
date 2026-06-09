import { isValidSeeds, type CustomThemeSeeds } from '@shared/theme/palette/customPalette'

export const THEME_STORAGE_KEY = 'theme'
const CUSTOM_SEEDS_STORAGE_KEY = 'oc_custom_theme_seeds'

// Values stored before the theme registry existed (binary light/dark switch).
// They map to the product-default (CI) family, keeping the mode preference.
const LEGACY_IDS: Record<string, string> = {
    light: 'ci-light',
    dark: 'ci-dark',
}

export function readStoredThemeId(): string | null {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (!stored) return null
    return LEGACY_IDS[stored] ?? stored
}

export function storeThemeId(id: string) {
    localStorage.setItem(THEME_STORAGE_KEY, id)
}

export function readCustomThemeSeeds(): CustomThemeSeeds | null {
    const stored = localStorage.getItem(CUSTOM_SEEDS_STORAGE_KEY)
    if (!stored) return null
    try {
        const parsed: unknown = JSON.parse(stored)
        return isValidSeeds(parsed) ? parsed : null
    } catch {
        return null
    }
}

export function storeCustomThemeSeeds(seeds: CustomThemeSeeds) {
    localStorage.setItem(CUSTOM_SEEDS_STORAGE_KEY, JSON.stringify(seeds))
}

export function clearCustomThemeSeeds() {
    localStorage.removeItem(CUSTOM_SEEDS_STORAGE_KEY)
}
