import { useI18n } from '@shared/i18n/hooks/useI18n'
import { IS_MAC } from '@shared/utils/platform'
import './onboardingCode.css'

const MAC_COMMAND_GLYPH = '⌘'

/**
 * Points a step at the palette command that repeats or continues its task, e.g.
 * `Command: ⌘ + K → help onboarding`. Laid out as a centred flex row because the
 * label, the keycaps and the snippet are boxes of different heights and would
 * otherwise sit on their shared text baseline.
 */
export function CommandHint({ command }: { command: string }) {
    const { t } = useI18n('onboarding')
    return (
        <span className="onboarding-command-note">
            <span>{t('notes.commandLabel')}:</span>
            <kbd>{IS_MAC ? MAC_COMMAND_GLYPH : t('notes.ctrlKey')}</kbd>
            <span aria-hidden>+</span>
            <kbd>K</kbd>
            <span aria-hidden>&rarr;</span>
            <code className="onboarding-code-token">{command}</code>
        </span>
    )
}
