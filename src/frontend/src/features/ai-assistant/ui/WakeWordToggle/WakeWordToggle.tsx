import { useEffect, type CSSProperties } from 'react'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { IconButton } from '@shared/ui/primitives/IconButton'
import { Tooltip } from '@shared/ui/primitives/Tooltip'
import type { BeebotState } from '@shared/ui/primitives/Icon/Icon.types'
import { isAiConfigured, useGetAiHealthQuery } from '../../api/aiApi'
import { canRecordVoice } from '../../voice/useVoiceRecorder'
import { WAKE_WORD } from '../../voice/wakeWord'
import { useWakeWordListenerStore } from '../../voice/wakeWordListener.store'
import { useBeebotFlightStore } from '../../voice/beebotFlight.store'
import { useBeebotReplyStore } from '../../voice/beebotReply.store'
import { canSpeak } from '../../voice/speechOutput'
import './wakeWordToggle.css'

// Speech RMS rarely passes 0.2; scaled so normal speaking fills the ring.
const LEVEL_SCALE = 5

/**
 * Turns the always-listening assistant on and off, and shows what it is doing: the Beebot glyph
 * rests, perks up while it hears speech (the ring follows the voice) and blinks while a request
 * is being worked on. Absent while the gateway has no speech service or the browser cannot record.
 */
export function WakeWordToggle() {
    const { t } = useI18n('common')
    const isConfigured = isAiConfigured()
    const health = useGetAiHealthQuery(undefined, { skip: !isConfigured })
    const { status, level, isHearing, isWorking, start, stop } = useWakeWordListenerStore()
    const isAway = useBeebotFlightStore(state => state.isAway)
    const { isMuted, setMuted } = useBeebotReplyStore()
    const isAvailable = isConfigured && health.data?.status === 'ok' && Boolean(health.data.speech?.available) && canRecordVoice()

    useEffect(() => {
        if (!isAvailable && status !== 'off') stop()
    }, [isAvailable, status, stop])

    if (!isAvailable) return null
    const isOn = status !== 'off'
    const state: BeebotState = !isOn ? 'off' : isWorking ? 'thinking' : isHearing ? 'active' : 'idle'
    const style = { '--wake-level': isHearing ? Math.min(1, level * LEVEL_SCALE) : 0 } as CSSProperties
    const toggle = (
        <Tooltip content={t(isOn ? 'commandPalette.wakeWord.stop' : 'commandPalette.wakeWord.start', { name: WAKE_WORD.name })}>
            <span className="wakeWordToggle" data-state={state} data-away={isAway || undefined} style={style} role="status"
                aria-label={t(`commandPalette.wakeWord.state.${state}`, { name: WAKE_WORD.name })}>
                <IconButton type="text" size="sm" testId="voice-wake-toggle" loading={status === 'starting'}
                    iconProps={{ name: 'beebot', state, size: 20 }}
                    onClick={() => (isOn ? stop() : void start())} />
            </span>
        </Tooltip>
    )
    if (!isOn || !canSpeak()) return toggle
    return (
        <span className="wakeWordControls">
            {toggle}
            <Tooltip content={t(isMuted ? 'commandPalette.beebot.unmute' : 'commandPalette.beebot.mute', { name: WAKE_WORD.name })}>
                <IconButton type="text" size="xs" testId="voice-wake-mute"
                    iconProps={{ name: isMuted ? 'sound-off' : 'sound', isSubtle: true }}
                    onClick={() => setMuted(!isMuted)} />
            </Tooltip>
        </span>
    )
}
