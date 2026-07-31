import { createCustomPalette, type CustomThemeSeeds } from '@shared/theme/palette/customPalette'
import type { Palette } from '@shared/theme/palette/types'
import type { ThemeMode } from '@shared/theme/types'

/**
 * OpenCelium Corporate Identity seeds, confirmed by marketing (2026-06-05):
 * canonical brand blue #007bff, official teal secondary #15779b, and the
 * slate tone from opencelium.io section backgrounds as the neutral tint.
 */
export const CI_SEEDS: CustomThemeSeeds = {
    primary: '#007bff',
    accent: '#15779b',
    neutral: '#2c3d49',
}

export const createCiPalette = (mode: ThemeMode): Palette => createCustomPalette(CI_SEEDS, mode)
