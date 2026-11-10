import { useEffect, useRef, useState } from 'react'
import { findVisibleTarget } from '@features/onboarding/workflow-tutorial/model/findVisibleTarget'
import { useBeebotFlightStore } from '../../voice/beebotFlight.store'
import { useWakeWordListenerStore } from '../../voice/wakeWordListener.store'
import { FOLLOW_PX, type Point, bankToward, centerOf, distance, flightDuration, perchOn } from './flightPath'

// Where the bee lives: the top bar's Beebot switch, or the AI menu button in the workflow editor.
const TOGGLE_SELECTOR = '[data-beebot-home]'

/** One leg of the trip: where the bee is headed, how long it takes, and which way it leans. */
export type Flight = { to: Point; durationMs: number; bank: number; key: number }

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/**
 * Drives the bee between the wake-word toggle and the element it points at. Runs one animation-frame loop while the
 * bee is out: a destination that moves far (the next guide step) starts a new flight, a small move (the canvas
 * panning) is followed in place, and once the destination is gone the bee flies home and the loop ends.
 * Only while the assistant is listening: with the microphone off there is no Beebot to send.
 */
export function useBeebotFlight(): { flight: Flight | null; isTravelling: boolean } {
    const destination = useBeebotFlightStore(state => state.destination)
    const setAway = useBeebotFlightStore(state => state.setAway)
    const isListening = useWakeWordListenerStore(state => state.status === 'on')
    const [flight, setFlight] = useState<Flight | null>(null)
    const [isTravelling, setTravelling] = useState(false)
    const flightRef = useRef<Flight | null>(null)
    const travellingUntil = useRef(0)
    const travellingRef = useRef(false)

    useEffect(() => {
        const isOut = Boolean(destination) && isListening
        if (!isOut && !flightRef.current) return
        let frame = 0
        const update = (next: Flight | null) => {
            flightRef.current = next
            setFlight(next)
        }
        const markTravelling = (value: boolean) => {
            if (travellingRef.current === value) return
            travellingRef.current = value
            setTravelling(value)
        }
        const flyTo = (to: Point, from: Point) => {
            const durationMs = prefersReducedMotion() ? 0 : flightDuration(distance(from, to))
            travellingUntil.current = performance.now() + durationMs
            markTravelling(durationMs > 0)
            update({ to, durationMs, bank: bankToward(from, to), key: (flightRef.current?.key ?? 0) + 1 })
        }

        const tick = () => {
            frame = requestAnimationFrame(tick)
            const toggle = findVisibleTarget(TOGGLE_SELECTOR)
            const current = flightRef.current
            if (!toggle) {
                if (current) update(null)
                setAway(false)
                cancelAnimationFrame(frame)
                return
            }
            const home = centerOf(toggle.getBoundingClientRect())
            const target = isOut && destination ? findVisibleTarget(destination.selector, destination.text) : null
            const viewport = { width: window.innerWidth, height: window.innerHeight }
            const wanted = target ? perchOn(target.getBoundingClientRect(), viewport) : isOut ? current?.to : home
            const isTravellingNow = performance.now() < travellingUntil.current
            markTravelling(isTravellingNow)

            if (!current) {
                // Take off from the toggle: placed there first, so the next frame has somewhere to fly from.
                if (!target) return
                setAway(true)
                update({ to: home, durationMs: 0, bank: 0, key: 0 })
                return
            }
            if (!wanted) return
            const gap = distance(current.to, wanted)
            if (gap > FOLLOW_PX) flyTo(wanted, current.to)
            else if (gap > 0.5 && !isTravellingNow) update({ ...current, to: wanted, durationMs: 0 })
            else if (!isOut && gap <= 0.5 && !isTravellingNow) {
                update(null)
                setAway(false)
                cancelAnimationFrame(frame)
            }
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [destination, isListening, setAway])

    return { flight, isTravelling }
}
