import type { SidebarSeed, ThemeFontFamily } from '@shared/theme/buildTheme'
import { CI_SEEDS, createCiPalette } from '@shared/theme/palette/ciPalette'
import { createCustomPalette } from '@shared/theme/palette/customPalette'
import type { Palette } from '@shared/theme/palette/types'
import { readCustomThemeSeeds, readSystemThemeSeeds } from '@shared/theme/themeStorage'
import type { ThemeMode } from '@shared/theme/types'

export type ThemeDefinition = {
    id: string
    label: string
    /** Themes of one family share a brand palette; toggleTheme switches mode within a family. */
    family: string
    mode: ThemeMode
    palette: Palette
    /** Per-theme font override; defaults applied by buildTheme when absent. */
    fontFamily?: ThemeFontFamily
    /** Own sidebar surface color; the sidebar follows the theme surface when absent. */
    sidebar?: SidebarSeed
}

export class ThemeRegistry {
    private themes = new Map<string, ThemeDefinition>()
    // Overrides "first registered wins" for getDefault(). The org-wide theme claims it
    // when one is configured, so users who never picked a theme follow the org brand
    // instead of the built-in product default.
    private defaultId: string | null = null

    register(def: ThemeDefinition) {
        this.themes.set(def.id, def)
    }

    unregister(id: string) {
        this.themes.delete(id)
        if (this.defaultId === id) this.defaultId = null
    }

    setDefault(id: string) {
        if (this.themes.has(id)) this.defaultId = id
    }

    get(id: string): ThemeDefinition | undefined {
        return this.themes.get(id)
    }

    has(id: string) {
        return this.themes.has(id)
    }

    getAll(): ThemeDefinition[] {
        return Array.from(this.themes.values())
    }

    getDefault(): ThemeDefinition {
        const preferred = this.defaultId ? this.themes.get(this.defaultId) : undefined
        if (preferred) return preferred
        const first = this.getAll()[0]
        if (!first) throw new Error('No themes registered')
        return first
    }

    /** The same family in the opposite mode (light↔dark), if registered. */
    getCounterpart(id: string): ThemeDefinition | undefined {
        const current = this.get(id)
        if (!current) return undefined
        return this.getAll().find(t => t.family === current.family && t.mode !== current.mode)
    }
}

export const themeRegistry = new ThemeRegistry()

// Built-ins self-register on module load so every consumer (providers as well as
// statically-evaluated entity definitions) always sees a populated registry.
// Registration order matters: the first entry is the product default
// (getDefault()) and drives the picker order.

// OpenCelium Corporate Identity themes (Open Sans is the corporate font; the
// sidebar carries the brand slate, same tone the landing page uses for sections).
const CI_FONT: ThemeFontFamily = { body: "'Open Sans', Inter, system-ui, sans-serif" }
const CI_SIDEBAR: SidebarSeed = { bg: CI_SEEDS.neutral }
themeRegistry.register({
    id: 'ci-light',
    label: 'OpenCelium Light',
    family: 'ci',
    mode: 'light',
    palette: createCiPalette('light'),
    fontFamily: CI_FONT,
    sidebar: CI_SIDEBAR,
})
themeRegistry.register({
    id: 'ci-dark',
    label: 'OpenCelium Dark',
    family: 'ci',
    mode: 'dark',
    palette: createCiPalette('dark'),
    fontFamily: CI_FONT,
    sidebar: CI_SIDEBAR,
})

// A previously saved user theme re-registers itself on startup so it shows up
// in every theme picker alongside the built-ins.
const storedSeeds = readCustomThemeSeeds()
if (storedSeeds) {
    const customSidebar = storedSeeds.sidebar ? { bg: storedSeeds.sidebar } : undefined
    themeRegistry.register({
        id: 'custom-light',
        label: 'Custom Light',
        family: 'custom',
        mode: 'light',
        palette: createCustomPalette(storedSeeds, 'light'),
        sidebar: customSidebar,
    })
    themeRegistry.register({
        id: 'custom-dark',
        label: 'Custom Dark',
        family: 'custom',
        mode: 'dark',
        palette: createCustomPalette(storedSeeds, 'dark'),
        sidebar: customSidebar,
    })
}

// The org-wide theme (GET /system-setting/theme_colors, cached locally) registers from
// the cache at module load for the same reason as the personal one — and takes over as
// the default so 'device' and every other implicit fallback resolve to it.
const systemSeeds = readSystemThemeSeeds()
if (systemSeeds) {
    const systemSidebar = systemSeeds.sidebar ? { bg: systemSeeds.sidebar } : undefined
    themeRegistry.register({
        id: 'system-light',
        label: 'System Light',
        family: 'system',
        mode: 'light',
        palette: createCustomPalette(systemSeeds, 'light'),
        sidebar: systemSidebar,
    })
    themeRegistry.register({
        id: 'system-dark',
        label: 'System Dark',
        family: 'system',
        mode: 'dark',
        palette: createCustomPalette(systemSeeds, 'dark'),
        sidebar: systemSidebar,
    })
    themeRegistry.setDefault('system-light')
}
