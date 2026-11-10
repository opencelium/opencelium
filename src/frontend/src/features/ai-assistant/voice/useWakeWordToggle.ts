import { useEffect, type CSSProperties } from 'react'
import type { BeebotState } from '@shared/ui/primitives/Icon/Icon.types'
import { isAiConfigured, useGetAiHealthQuery } from '../api/aiApi'
import { canRecordVoice } from './useVoiceRecorder'
import { useWakeWordListenerStore } from './wakeWordListener.store'
import { useBeebotFlightStore } from './beebotFlight.store'

// Speech RMS rarely passes 0.2; scaled so normal speaking fills the ring.
const LEVEL_SCALE = 5

/**
 * Beebot's on/off switch and what its glyph shows: resting, perked up while it hears speech (the ring follows the
 * voice), blinking while a request is worked on. Unavailable while the gateway has no speech service or the browser
 * cannot record, and switched off when that happens.
 */
export function useWakeWordToggle() {
    const isConfigured = isAiConfigured()
    const health = useGetAiHealthQuery(undefined, { skip: !isConfigured })
    const { status, level, isHearing, isWorking, start, stop } = useWakeWordListenerStore()
    const isAway = useBeebotFlightStore(state => state.isAway)
    const isAvailable = isConfigured && health.data?.status === 'ok' && Boolean(health.data.speech?.available) && canRecordVoice()

    useEffect(() => {
        if (!isAvailable && status !== 'off') stop()
    }, [isAvailable, status, stop])

    const isOn = status !== 'off'
    const state: BeebotState = !isOn ? 'off' : isWorking ? 'thinking' : isHearing ? 'active' : 'idle'
    const style = { '--wake-level': isHearing ? Math.min(1, level * LEVEL_SCALE) : 0 } as CSSProperties
    return {
        isAvailable, isOn, isStarting: status === 'starting', isAway, state, style,
        toggle: () => (isOn ? stop() : void start()),
    }
}
