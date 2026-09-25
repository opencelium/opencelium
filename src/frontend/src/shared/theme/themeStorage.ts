import { isValidSeeds, type CustomThemeSeeds } from '@shared/theme/palette/customPalette'

export const THEME_STORAGE_KEY = 'theme'
const CUSTOM_SEEDS_STORAGE_KEY = 'oc_custom_theme_seeds'
// Last seeds seen from GET /system-setting/theme_colors. Cached so the org theme is
// registered synchronously on the next load — before the authenticated fetch resolves,
// and on the login screen, where the endpoint needs a token nobody has yet.
const SYSTEM_SEEDS_STORAGE_KEY = 'oc_system_theme_seeds'

// Ids that no longer resolve: the pre-registry binary light/dark switch, and the
// retired Ant Design themes. Both map onto the product-default (CI) family so a stored
// choice keeps its light/dark intent instead of silently falling back to 'device'.
const LEGACY_IDS: Record<string, string> = {
    light: 'ci-light',
    dark: 'ci-dark',
    'ant-light': 'ci-light',
    'ant-dark': 'ci-dark',
}

export function readStoredThemeId(): string | null {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (!stored) return null
    return LEGACY_IDS[stored] ?? stored
}

export function storeThemeId(id: string) {
    localStorage.setItem(THEME_STORAGE_KEY, id)
}

function readSeeds(key: string): CustomThemeSeeds | null {
    const stored = localStorage.getItem(key)
    if (!stored) return null
    try {
        const parsed: unknown = JSON.parse(stored)
        return isValidSeeds(parsed) ? parsed : null
    } catch {
        return null
    }
}

export function readCustomThemeSeeds(): CustomThemeSeeds | null {
    return readSeeds(CUSTOM_SEEDS_STORAGE_KEY)
}

export function clearCustomThemeSeeds() {
    localStorage.removeItem(CUSTOM_SEEDS_STORAGE_KEY)
}

export function readSystemThemeSeeds(): CustomThemeSeeds | null {
    return readSeeds(SYSTEM_SEEDS_STORAGE_KEY)
}

export function storeSystemThemeSeeds(seeds: CustomThemeSeeds) {
    localStorage.setItem(SYSTEM_SEEDS_STORAGE_KEY, JSON.stringify(seeds))
}

export function clearSystemThemeSeeds() {
    localStorage.removeItem(SYSTEM_SEEDS_STORAGE_KEY)
}
