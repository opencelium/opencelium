import { useEffect, type CSSProperties } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi'
import { canRecordVoice } from '../../voice/useVoiceRecorder'
import { WAKE_WORD } from '../../voice/wakeWord'
import { useWakeWordListenerStore } from '../../voice/wakeWordListener.store'
import './wakeWordToggle.css'

// Speech RMS rarely passes 0.2; scaled so normal speaking fills the ring.
const LEVEL_SCALE = 5

/**
 * Turns the always-listening assistant on and off, and shows that it is on: the ring
 * follows the voice it hears, and dots run while a request is being worked on. Absent
 * while the gateway has no speech service or the browser cannot record.
 */
export function WakeWordToggle() {
    const { t } = useI18n('common')
    const isConfigured = isAiConfigured()
    const health = useGetAiHealthQuery(undefined, { skip: !isConfigured })
    const { status, level, isHearing, isWorking, start, stop } = useWakeWordListenerStore()
    const isAvailable = isConfigured && health.data?.status === 'ok' && Boolean(health.data.speech?.available) && canRecordVoice()

    useEffect(() => {
        if (!isAvailable && status !== 'off') stop()
    }, [isAvailable, status, stop])

    if (!isAvailable) return null
    const isOn = status !== 'off'
    const state = !isOn ? 'off' : isWorking ? 'working' : isHearing ? 'hearing' : 'on'
    const style = { '--wake-level': isHearing ? Math.min(1, level * LEVEL_SCALE) : 0 } as CSSProperties
    return (
        <Tooltip content={t(isOn ? 'commandPalette.wakeWord.stop' : 'commandPalette.wakeWord.start', { name: WAKE_WORD.name })}>
            <span className="wakeWordToggle" data-state={state} style={style} role="status"
                aria-label={isOn ? t('commandPalette.wakeWord.stop', { name: WAKE_WORD.name }) : undefined}>
                <IconButton type="text" size="sm" testId="voice-wake-toggle" loading={status === 'starting'}
                    iconProps={{ name: 'microphone', color: isOn ? 'primary' : 'inherit', size: 18 }}
                    onClick={() => (isOn ? stop() : void start())} />
            </span>
        </Tooltip>
    )
}
