import type { CSSProperties } from 'react'
import { Icon } from '@shared/ui/primitives/Icon'
import { useBeebotFlight } from './useBeebotFlight'
import './beebotFlight.css'

const SIZE = 24

/**
 * The Beebot glyph leaving the wake-word toggle to perch on what it points at (the workflow guide's current target),
 * and flying back when done. X and Y travel on separate easings so the path curves; an inner wrapper lifts, grows and
 * banks mid-flight. Decorative and click-through: the guide itself carries the meaning.
 */
export function BeebotFlight() {
    const { flight, isTravelling } = useBeebotFlight()
    if (!flight) return null
    const duration = `${flight.durationMs}ms`
    return (
        <div className="beebotFlight" aria-hidden="true">
            <div className="beebotFlight__x" style={{ transform: `translateX(${flight.to.x}px)`, transitionDuration: duration }}>
                <div className="beebotFlight__y" style={{ transform: `translateY(${flight.to.y}px)`, transitionDuration: duration }}>
                    <div key={flight.key} className={flight.durationMs > 0 ? 'beebotFlight__lift' : undefined}
                        style={{ animationDuration: duration, '--beebot-bank': `${flight.bank}deg` } as CSSProperties}>
                        <Icon name="beebot" state={isTravelling ? 'flying' : 'idle'} size={SIZE} />
                    </div>
                </div>
            </div>
        </div>
    )
}
