import {
    blue,
    blueDark,
    geekblue,
    geekblueDark,
    gold,
    goldDark,
    green,
    greenDark,
    red,
    redDark,
} from '@ant-design/colors'
import type { Palette } from '@shared/theme/palette/types'
import type { ThemeMode } from '@shared/theme/types'

/**
 * Ant Design's neutral palette (gray-1 … gray-13) — not exported by
 * @ant-design/colors, values from https://ant.design/docs/spec/colors.
 */
export const ANT_NEUTRAL = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#434343',
    '#262626',
    '#1f1f1f',
    '#141414',
    '#000000',
]

/**
 * The default Corporate Identity palette, built entirely from Ant Design's
 * official color scales. Dark mode uses the pre-generated dark variants
 * (derived against the #141414 background, same as antd's dark algorithm).
 */
export function createAntPalette(mode: ThemeMode): Palette {
    const isDark = mode === 'dark'
    return {
        neutral: ANT_NEUTRAL,
        primary: isDark ? [...blueDark] : [...blue],
        accent: isDark ? [...geekblueDark] : [...geekblue],
        success: isDark ? [...greenDark] : [...green],
        warning: isDark ? [...goldDark] : [...gold],
        error: isDark ? [...redDark] : [...red],
        info: isDark ? [...blueDark] : [...blue],
    }
}
