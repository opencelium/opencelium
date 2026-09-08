import { useEffect, useState } from 'react'

const TOOLTIP_SELECTOR = '.onboarding-tooltip'

/**
 * Live height of the tour dialog, so the docked panel can match it exactly rather
 * than guess. Joyride renders the tooltip outside this component tree, so it is
 * measured from the DOM; a ResizeObserver keeps it current as the dialog changes
 * height — it narrows when the panel opens, and the invoker table's row count
 * varies per install, so a fixed number would only ever be right by accident.
 *
 * Returns null when there is nothing to match (inactive, no tooltip, or hidden by
 * the narrow-viewport rule), leaving the panel to size to its own content.
 */
export function useTourDialogHeight(active: boolean): number | null {
    const [height, setHeight] = useState<number | null>(null)

    useEffect(() => {
        if (!active) return

        const tooltip = document.querySelector<HTMLElement>(TOOLTIP_SELECTOR)
        if (!tooltip) return

        // ResizeObserver delivers an initial observation on observe(), so there is
        // no need to measure up front — which would be a setState in the effect body.
        // offsetHeight, not contentRect: the tooltip's border and padding are part
        // of the box the panel has to line up with.
        const observer = new ResizeObserver(() => {
            setHeight(tooltip.offsetHeight > 0 ? tooltip.offsetHeight : null)
        })
        observer.observe(tooltip)
        return () => observer.disconnect()
    }, [active])

    // Derived rather than reset in the effect, so going inactive costs no render.
    return active ? height : null
}
