import { useEffect, useState } from 'react'
import {
    DASHBOARD_TOUR_STEPS,
    READY_STEP_ID,
    targetFor,
    type DashboardTourStepId,
} from './dashboardTourSteps'

export const POLL_MS = 100
/** ~3s: the palette navigates home first, and the page fades in on arrival. */
const MAX_ATTEMPTS = 30

/**
 * Which widgets are on the page, resolved once per run of the tour.
 *
 * Polled rather than read on the first render: the tour is launched from the
 * palette, which navigates to the dashboard on its way, so the anchors do not
 * exist yet when `active` flips — and the route transition animates. `null` means
 * "not resolved yet", which keeps the tour from opening on an empty step list.
 */
export function useDashboardTourTargets(active: boolean): DashboardTourStepId[] | null {
    const [presentIds, setPresentIds] = useState<DashboardTourStepId[] | null>(null)

    // No reset when the tour closes: the host renders nothing in that case, so a
    // stale list is invisible — and clearing it here would be a setState in the
    // effect body. The next run re-resolves before anything is shown.
    useEffect(() => {
        if (!active) return

        let timer = 0
        const attempt = (remaining: number) => {
            // Gated on the page's own anchor: the top bar is already mounted, so
            // resolving on any hit would snapshot a tour with only chrome in it.
            if (document.querySelector(targetFor(READY_STEP_ID)) !== null) {
                setPresentIds(
                    DASHBOARD_TOUR_STEPS
                        .map(step => step.id)
                        .filter(id => document.querySelector(targetFor(id)) !== null),
                )
                return
            }
            if (remaining > 0) timer = window.setTimeout(() => attempt(remaining - 1), POLL_MS)
        }
        // Even the first look is deferred a tick: the anchors are rarely mounted
        // yet, and resolving inside the effect body would set state synchronously.
        timer = window.setTimeout(() => attempt(MAX_ATTEMPTS), 0)

        return () => window.clearTimeout(timer)
    }, [active])

    return presentIds
}
