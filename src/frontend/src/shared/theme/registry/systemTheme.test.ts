import { afterEach, describe, expect, it } from 'vitest'
import type { CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import {
    applySystemThemeSeeds,
    hasSystemTheme,
    isSystemThemeId,
    removeSystemTheme,
    SYSTEM_THEME_IDS,
} from '@shared/theme/registry/systemTheme'
import { themeRegistry } from '@shared/theme/registry/themeRegistry'
import { readSystemThemeSeeds } from '@shared/theme/themeStorage'

const SEEDS: CustomThemeSeeds = {
    primary: '#0f766e',
    accent: '#f59e0b',
    neutral: '#8c8c8c',
    sidebar: '#2c3d49',
}

describe('system theme', () => {
    afterEach(() => {
        removeSystemTheme()
    })

    it('registers both variants and claims the registry default', () => {
        const builtInDefault = themeRegistry.getDefault().id

        applySystemThemeSeeds(SEEDS)

        expect(hasSystemTheme()).toBe(true)
        expect(themeRegistry.has(SYSTEM_THEME_IDS.dark)).toBe(true)
        // The default is what 'device' and every implicit fallback resolve to, so
        // claiming it is what makes the org theme win over the built-in product one.
        expect(themeRegistry.getDefault().id).toBe(SYSTEM_THEME_IDS.light)
        expect(themeRegistry.getDefault().id).not.toBe(builtInDefault)
    })

    it('pairs the variants so a mode toggle stays inside the org theme', () => {
        applySystemThemeSeeds(SEEDS)

        expect(themeRegistry.getCounterpart(SYSTEM_THEME_IDS.light)?.id).toBe(SYSTEM_THEME_IDS.dark)
        expect(themeRegistry.getCounterpart(SYSTEM_THEME_IDS.dark)?.id).toBe(SYSTEM_THEME_IDS.light)
    })

    it('caches the seeds so the next load registers before the fetch resolves', () => {
        applySystemThemeSeeds(SEEDS)

        expect(readSystemThemeSeeds()).toEqual(SEEDS)
    })

    it('hands the default back to the built-in theme on removal', () => {
        const builtInDefault = themeRegistry.getDefault().id
        applySystemThemeSeeds(SEEDS)

        removeSystemTheme()

        expect(hasSystemTheme()).toBe(false)
        expect(themeRegistry.has(SYSTEM_THEME_IDS.dark)).toBe(false)
        expect(themeRegistry.getDefault().id).toBe(builtInDefault)
        expect(readSystemThemeSeeds()).toBeNull()
    })

    it('recognises only its own ids', () => {
        expect(isSystemThemeId(SYSTEM_THEME_IDS.light)).toBe(true)
        expect(isSystemThemeId(SYSTEM_THEME_IDS.dark)).toBe(true)
        expect(isSystemThemeId('custom-light')).toBe(false)
        expect(isSystemThemeId('device')).toBe(false)
    })
})
