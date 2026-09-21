import { useI18n } from '@shared/i18n/hooks/useI18n'
import { IS_MAC } from '@shared/utils/platform'

const MAC_COMMAND_GLYPH = '⌘'

/**
 * The command palette's modifier key, as the user's platform names it: the glyph on
 * macOS, the translated word ("Ctrl" / "Strg") everywhere else. One definition so
 * every hint in the tour agrees on it.
 */
export function usePaletteKeyLabel(): string {
    const { t } = useI18n('onboarding')
    return IS_MAC ? MAC_COMMAND_GLYPH : t('notes.ctrlKey')
}
