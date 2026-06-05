import {
    blue,
    blueDark,
    generate,
    gold,
    goldDark,
    green,
    greenDark,
    red,
    redDark,
} from '@ant-design/colors'
import { FastColor } from '@ant-design/fast-color'
import { ANT_NEUTRAL } from '@shared/theme/palette/antPalette'
import type { NeutralScale, Palette } from '@shared/theme/palette/types'
import type { ThemeMode } from '@shared/theme/types'

export type CustomThemeSeeds = {
    primary: string
    accent: string
    neutral: string
}

export const isValidSeedColor = (value: unknown): value is string =>
    typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)

export const isValidSeeds = (value: unknown): value is CustomThemeSeeds => {
    if (!value || typeof value !== 'object') return false
    const seeds = value as Record<keyof CustomThemeSeeds, unknown>
    return isValidSeedColor(seeds.primary) && isValidSeedColor(seeds.accent) && isValidSeedColor(seeds.neutral)
}

// antd's dark algorithm derives palettes against this background; keep in sync with it
const DARK_BG = '#141414'

// 8% keeps the tint visible on large surfaces without shifting perceived gray steps
const NEUTRAL_TINT_PERCENT = 8

const tintedNeutral = (seed: string): NeutralScale =>
    ANT_NEUTRAL.map((step, index) =>
        // keep pure black so text/inverted extremes stay maximal-contrast
        index === ANT_NEUTRAL.length - 1 ? step : new FastColor(step).mix(seed, NEUTRAL_TINT_PERCENT).toHexString(),
    )

/**
 * Expands the user's three seed colors into a full palette via antd's scale
 * generator. Status scales stay on the Ant Design presets — success/error/
 * warning semantics are not user-brandable.
 */
export function createCustomPalette(seeds: CustomThemeSeeds, mode: ThemeMode): Palette {
    const isDark = mode === 'dark'
    const scale = (seed: string) =>
        isDark ? generate(seed, { theme: 'dark', backgroundColor: DARK_BG }) : generate(seed)

    return {
        neutral: tintedNeutral(seeds.neutral),
        primary: scale(seeds.primary),
        accent: scale(seeds.accent),
        success: isDark ? [...greenDark] : [...green],
        warning: isDark ? [...goldDark] : [...gold],
        error: isDark ? [...redDark] : [...red],
        info: isDark ? [...blueDark] : [...blue],
    }
}
