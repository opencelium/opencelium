import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps } from 'react-joyride'
import { useLocation } from 'react-router-dom'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useOnboardingStore } from '../../model/onboarding.store'
import { ONBOARDING_Z_INDEX } from '../../model/types'
import { OnboardingTooltip } from '../../ui/OnboardingTooltip'
import { usePaletteKeyLabel } from '../../ui/usePaletteKeyLabel'
import { buildDashboardTourSteps } from '../model/buildDashboardTourSteps'
import { useDashboardTourStore } from '../model/dashboardTour.store'
import { useDashboardTourTargets } from '../model/useDashboardTourTargets'
import '../../ui/onboardingTooltip.css'
import './dashboardTour.css'

const DASHBOARD_ROUTE = '/'
/** Clears the sticky header when Joyride scrolls a lower widget into view. */
const SCROLL_OFFSET = 120

/**
 * Walks the dashboard's widgets, anchored to each one in turn. Built on Joyride
 * with the intro tour's own tooltip — unlike the workflow tutorial, which needed
 * a corner-pinned pill because its highlight moves across the whole editor.
 *
 * Mounted globally beside the other two tours and inert until an admin asks for
 * it from the palette while on the dashboard, so the page needs no knowledge of it.
 */
export function DashboardTour() {
    const { t } = useI18n('onboarding')
    const isAdmin = useIsAdmin()
    const { pathname } = useLocation()
    const { themeMode } = useTheme()
    const paletteKeyLabel = usePaletteKeyLabel()
    const { requested, dismiss } = useDashboardTourStore()
    // Two tours over one page would stack two backdrops. The intro tour owns the
    // first-run experience, so this one waits for it to be out of the way — and
    // opens on its own once it is, the request still standing.
    const isIntroRunning = useOnboardingStore(state => state.status === 'running')
    const [stepIndex, setStepIndex] = useState(0)

    const active = isAdmin && requested && !isIntroRunning && pathname === DASHBOARD_ROUTE
    const presentIds = useDashboardTourTargets(active)

    const close = useCallback(() => {
        setStepIndex(0)
        dismiss()
    }, [dismiss])

    // Leaving the dashboard ends the run rather than parking it: there is no
    // multi-page journey here worth resuming. Latched on having been active, so
    // the palette's own navigation home cannot cancel the request it just made.
    const wasActiveRef = useRef(false)
    useEffect(() => {
        if (active) {
            wasActiveRef.current = true
            return
        }
        if (wasActiveRef.current) {
            wasActiveRef.current = false
            close()
        }
    }, [active, close])

    const steps = useMemo(
        () => (presentIds ? buildDashboardTourSteps({ t, presentIds, paletteKeyLabel, onDismiss: close }) : []),
        [close, paletteKeyLabel, presentIds, t],
    )

    const handleCallback = ({ action, index, status, type }: CallBackProps) => {
        if (action === ACTIONS.CLOSE || status === STATUS.SKIPPED || status === STATUS.FINISHED) {
            close()
            return
        }
        // A widget that disappeared mid-tour (a card crashing into its boundary,
        // say) must not park the tour on a target that will never resolve.
        if (type === EVENTS.TARGET_NOT_FOUND || type === EVENTS.STEP_AFTER) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
        }
    }

    if (!active || steps.length === 0) return null

    return (
        <Joyride
            callback={handleCallback}
            continuous
            disableOverlayClose
            floaterProps={{ disableAnimation: true }}
            hideCloseButton
            run
            scrollOffset={SCROLL_OFFSET}
            scrollToFirstStep
            showProgress={false}
            stepIndex={stepIndex}
            steps={steps}
            tooltipComponent={OnboardingTooltip}
            styles={{
                options: {
                    arrowColor: 'var(--color-background-surface)',
                    overlayColor: themeMode === 'dark' ? 'rgba(2, 4, 8, .70)' : 'rgba(12, 16, 22, .55)',
                    primaryColor: 'var(--color-action-primary)',
                    zIndex: ONBOARDING_Z_INDEX.tooltip,
                },
                spotlight: {
                    border: '2px solid var(--color-action-primary)',
                    borderRadius: 'var(--radius-lg)',
                },
            }}
        />
    )
}
