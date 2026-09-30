import { useEffect, type RefObject } from 'react'

const HEIGHT_VAR = '--onboarding-side-height'

/**
 * Publishes the docked panel's height so the tour dialog can match it, as a CSS
 * variable on <html> rather than React state — the dialog is a Joyride tooltip
 * outside this tree, and rebuilding the step list on every resize frame to pass a
 * number down would be far more expensive than letting CSS read one.
 *
 * The direction matters: the panel sizes to the wizard and the dialog follows. If
 * each measured the other they would chase each other's height forever.
 */
export function useSyncTourDialogHeight(panelRef: RefObject<HTMLElement | null>, active: boolean) {
    useEffect(() => {
        const root = document.documentElement
        const panel = panelRef.current
        if (!active || !panel) {
            root.style.removeProperty(HEIGHT_VAR)
            return
        }

        // ResizeObserver delivers an initial observation on observe(), so there is
        // no measure-up-front — which would run during the effect body.
        const observer = new ResizeObserver(() => {
            root.style.setProperty(HEIGHT_VAR, `${panel.offsetHeight}px`)
        })
        observer.observe(panel)

        return () => {
            observer.disconnect()
            root.style.removeProperty(HEIGHT_VAR)
        }
    }, [active, panelRef])
}
