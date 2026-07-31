import { FastColor } from '@ant-design/fast-color'
import { ANT_NEUTRAL } from '@shared/theme/palette/antPalette'
import type { ColorScale, Palette } from '@shared/theme/palette/types'
import type { SidebarTokens, StatusTokens, ThemeTokens } from '@shared/theme/tokens'
import type { ThemeMode } from '@shared/theme/types'

export type ThemeFontFamily = {
    body: string
    mono?: string
}

export type SidebarSeed = {
    bg: string
}

export type BuildThemeOptions = {
    fontFamily?: ThemeFontFamily
    sidebar?: SidebarSeed
}

// antd Alert/Tag convention: scale[5] text tone, scale[0] tinted background, scale[2] border
const statusTokens = (scale: ColorScale): StatusTokens => ({
    fg: scale[5],
    bg: scale[0],
    border: scale[2],
})

/**
 * The sidebar can carry its own surface color (e.g. a brand-dark rail on a
 * light theme). Without a seed it simply follows the theme surface; with one,
 * all foreground/hover/selection tones are derived from the seed's darkness
 * so any background stays readable.
 */
function sidebarTokens(palette: Palette, mode: ThemeMode, seed?: SidebarSeed): SidebarTokens {
    const n = palette.neutral
    if (!seed) {
        const isDarkMode = mode === 'dark'
        return {
            bg: isDarkMode ? n[11] : n[0],
            fg: isDarkMode ? n[4] : n[10],
            fgSubtle: isDarkMode ? n[5] : n[7],
            hover: isDarkMode ? n[9] : n[1],
            selectedBg: palette.primary[0],
            selectedFg: palette.primary[5],
            border: isDarkMode ? n[9] : n[3],
        }
    }

    const bg = new FastColor(seed.bg)
    const isDark = bg.isDark()
    return {
        bg: seed.bg,
        fg: isDark ? n[0] : n[10],
        fgSubtle: isDark ? bg.mix(n[0], 60).toHexString() : bg.mix(n[12], 55).toHexString(),
        hover: isDark ? bg.lighten(7).toHexString() : bg.darken(5).toHexString(),
        selectedBg: isDark ? palette.primary[5] : palette.primary[0],
        selectedFg: isDark ? n[0] : palette.primary[5],
        border: isDark ? bg.lighten(9).toHexString() : bg.darken(9).toHexString(),
    }
}

/**
 * Layer 2 of the theme model: maps a brand palette onto semantic tokens.
 * Neutral indices follow antd's text/background alphas (e.g. light text
 * rgba(0,0,0,0.88) ≈ neutral[10], secondary 0.65 ≈ neutral[7]).
 */
export function buildTheme(palette: Palette, mode: ThemeMode, options?: BuildThemeOptions): ThemeTokens {
    const { fontFamily, sidebar } = options ?? {}
    const n = palette.neutral
    const isDark = mode === 'dark'

    return {
        color: {
            text: {
                primary: isDark ? n[4] : n[10],
                secondary: isDark ? n[5] : n[7],
                disabled: isDark ? n[8] : n[5],
                inverted: isDark ? n[12] : n[0],
                onAction: n[0],
            },
            background: {
                app: isDark ? n[12] : n[2],
                page: isDark ? n[12] : n[2],
                surface: isDark ? n[11] : n[0],
                elevated: isDark ? n[10] : n[0],
                // Light: untinted pure white so fields read crisply against a
                // (possibly brand-tinted) surface. Dark: same as surface — dark
                // controls separate via border, not fill.
                input: isDark ? n[11] : ANT_NEUTRAL[0],
                hover: isDark ? n[9] : n[1],
                disabled: isDark ? n[9] : n[3],
            },
            border: {
                subtle: isDark ? n[9] : n[3],
                default: isDark ? n[8] : n[4],
                strong: isDark ? n[7] : n[5],
            },
            action: {
                primary: palette.primary[5],
                primaryHover: palette.primary[4],
                primaryActive: palette.primary[6],
                primarySubtle: palette.primary[0],
                secondary: palette.accent[5],
                danger: palette.error[5],
                dangerHover: palette.error[4],
            },
            status: {
                success: statusTokens(palette.success),
                warning: statusTokens(palette.warning),
                error: statusTokens(palette.error),
                info: statusTokens(palette.info),
            },
            sidebar: sidebarTokens(palette, mode, sidebar),
        },

        typography: {
            fontFamily: {
                body: fontFamily?.body ?? 'Inter, system-ui, sans-serif',
                mono: fontFamily?.mono ?? 'JetBrains Mono, monospace',
            },
            fontSize: {
                sm: '12px',
                md: '14px',
                lg: '18px',
            },
            fontWeight: {
                regular: 400,
                medium: 500,
                bold: 600,
            },
        },

        spacing: {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
        },

        radius: {
            sm: 4,
            md: 8,
            lg: 12,
        },
        shadow: {
            sm: isDark ? '0 2px 8px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.15)',
            md: '0 10px 30px rgba(0,0,0,0.25)',
            lg: isDark ? '0 20px 60px rgba(0,0,0,0.35)' : '0 10px 30px rgba(0,0,0,0.35)',
        },
    }
}
