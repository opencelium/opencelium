import { createAntPalette } from '@shared/theme/palette/antPalette'
import { createCustomPalette } from '@shared/theme/palette/customPalette'
import type { Palette } from '@shared/theme/palette/types'
import { readCustomThemeSeeds } from '@shared/theme/themeStorage'
import type { ThemeMode } from '@shared/theme/types'

export type ThemeDefinition = {
    id: string
    label: string
    /** Themes of one family share a brand palette; toggleTheme switches mode within a family. */
    family: string
    mode: ThemeMode
    palette: Palette
}

export class ThemeRegistry {
    private themes = new Map<string, ThemeDefinition>()

    register(def: ThemeDefinition) {
        this.themes.set(def.id, def)
    }

    unregister(id: string) {
        this.themes.delete(id)
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
themeRegistry.register({
    id: 'ant-light',
    label: 'Light',
    family: 'ant',
    mode: 'light',
    palette: createAntPalette('light'),
})
themeRegistry.register({
    id: 'ant-dark',
    label: 'Dark',
    family: 'ant',
    mode: 'dark',
    palette: createAntPalette('dark'),
})

// A previously saved user theme re-registers itself on startup so it shows up
// in every theme picker alongside the built-ins.
const storedSeeds = readCustomThemeSeeds()
if (storedSeeds) {
    themeRegistry.register({
        id: 'custom-light',
        label: 'Custom Light',
        family: 'custom',
        mode: 'light',
        palette: createCustomPalette(storedSeeds, 'light'),
    })
    themeRegistry.register({
        id: 'custom-dark',
        label: 'Custom Dark',
        family: 'custom',
        mode: 'dark',
        palette: createCustomPalette(storedSeeds, 'dark'),
    })
}
