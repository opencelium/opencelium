import { useI18n } from '@shared/i18n/hooks/useI18n'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { WAKE_WORD } from '../../voice/wakeWord'
import { useWakeWordToggle } from '../../voice/useWakeWordToggle'
import './wakeWordToggle.css'

/** The top bar's Beebot switch; in the workflow editor it lives in the AI menu instead. */
export function WakeWordToggle() {
    const { t } = useI18n('common')
    const beebot = useWakeWordToggle()
    if (!beebot.isAvailable) return null
    return (
        <Tooltip content={t(beebot.isOn ? 'commandPalette.wakeWord.stop' : 'commandPalette.wakeWord.start', { name: WAKE_WORD.name })}>
            <span className="wakeWordToggle" data-state={beebot.state} data-away={beebot.isAway || undefined} data-beebot-home
                style={beebot.style} role="status" aria-label={t(`commandPalette.wakeWord.state.${beebot.state}`, { name: WAKE_WORD.name })}>
                <IconButton type="text" size="sm" testId="voice-wake-toggle" loading={beebot.isStarting}
                    iconProps={{ name: 'beebot', state: beebot.state, size: 20 }} onClick={beebot.toggle} />
            </span>
        </Tooltip>
    )
}
