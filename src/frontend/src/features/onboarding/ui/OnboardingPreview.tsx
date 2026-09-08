import { useCallback, useRef, useState } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import type { CallBackProps } from 'react-joyride'
import { useLocation } from 'react-router-dom'
import { hasComponentPermission } from '@/engine/policy'
import { useAuth } from '@features/auth/useAuth'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { useOnboardingStore } from '../model/onboarding.store'
import { useIntroSteps } from '../model/useIntroSteps'
import { useTourLifecycle } from '../model/useTourLifecycle'
import { ONBOARDING_Z_INDEX, PALETTE_TOUR_TARGET } from '../model/types'
import { OnboardingTooltip } from './OnboardingTooltip'
import { OnboardingChecklist } from './OnboardingChecklist'
import './onboardingTooltip.css'

/** ?onboarding=1 replays the tour even after it has been completed. */
const PREVIEW_PARAM = 'onboarding'
/** The checklist would sit on top of the workflow canvas' own controls. */
const CHECKLIST_HIDDEN_ROUTE = '/workflow/'
/** Ring drawn around the spotlit palette, in px. */
const SPOTLIGHT_PADDING = 8

export function OnboardingPreview() {
    const { user, normalizedUser } = useAuth()
    const isAdmin = useIsAdmin()
    const { themeMode } = useTheme()
    const location = useLocation()
    const previousPathRef = useRef(location.pathname)
    const allowNextRouteChangeRef = useRef(false)
    const [paletteTargetMissing, setPaletteTargetMissing] = useState(false)
    const { checklistDismissed, complete, dismissChecklist, finishTour, hydrate, hydrated, pause, restart, start, status, stepId } = useOnboardingStore()

    const previewRequested = new URLSearchParams(location.search).get(PREVIEW_PARAM) === '1'
    const overlayColor = themeMode === 'dark' ? 'rgba(2, 4, 8, .70)' : 'rgba(12, 16, 22, .55)'
    const paletteTargetRect = stepId === 'palette' && typeof document !== 'undefined'
        ? document.querySelector(PALETTE_TOUR_TARGET)?.getBoundingClientRect()
        : undefined

    const { steps, stepIndex, setStepIndex, activeStepIds, advance, goToIndex, invokerCount, reset } = useIntroSteps({
        isAdmin,
        canCreateInvoker: hasComponentPermission(normalizedUser?.permissions ?? [], 'INVOKER', 'CREATE'),
        canCreateConnector: hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTOR', 'CREATE'),
        paletteTargetMissing,
    })

    const handleRestartRequested = useCallback(() => {
        allowNextRouteChangeRef.current = true
        setPaletteTargetMissing(false)
        reset()
        restart()
    }, [reset, restart])

    useTourLifecycle({
        userId: user?.userId,
        isAdmin,
        hydrated,
        status,
        stepId,
        previewRequested,
        pathname: location.pathname,
        hydrate,
        start,
        pause,
        onRestartRequested: handleRestartRequested,
        onAdvance: advance,
        onStepRestored: setStepIndex,
        activeStepIds,
        allowNextRouteChangeRef,
        previousPathRef,
    })

    const handleCallback = ({ action, index, status: joyrideStatus, type }: CallBackProps) => {
        if (type === EVENTS.TARGET_NOT_FOUND) {
            if (activeStepIds[index] === 'palette') setPaletteTargetMissing(true)
            return
        }
        if (action === ACTIONS.CLOSE || joyrideStatus === STATUS.SKIPPED) {
            finishTour()
            return
        }
        if (type === EVENTS.STEP_AFTER) {
            // Joyride replays STEP_AFTER for a step the store has already left behind.
            if (activeStepIds[index] !== useOnboardingStore.getState().stepId) return
            goToIndex(action === ACTIONS.PREV ? index - 1 : index + 1)
        }
        if (joyrideStatus === STATUS.FINISHED) complete()
    }

    const isRunning = hydrated && isAdmin && status === 'running'
    const showChecklist = hydrated && isAdmin && !checklistDismissed && !location.pathname.startsWith(CHECKLIST_HIDDEN_ROUTE)

    return (
        <>
            {isRunning && (
                <div
                    aria-hidden
                    className="onboarding-backdrop"
                    style={paletteTargetRect ? {
                        zIndex: ONBOARDING_Z_INDEX.backdrop,
                        top: paletteTargetRect.top - SPOTLIGHT_PADDING,
                        left: paletteTargetRect.left - SPOTLIGHT_PADDING,
                        width: paletteTargetRect.width + SPOTLIGHT_PADDING * 2,
                        height: paletteTargetRect.height + SPOTLIGHT_PADDING * 2,
                        border: '2px solid var(--color-action-primary)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: `0 0 0 9999px ${overlayColor}`,
                    } : { zIndex: ONBOARDING_Z_INDEX.backdrop, inset: 0, backgroundColor: overlayColor }}
                />
            )}
            <Joyride
                callback={handleCallback}
                continuous
                disableOverlay
                disableOverlayClose
                disableScrolling
                floaterProps={{ disableAnimation: true }}
                hideCloseButton
                run={isRunning}
                showProgress={false}
                stepIndex={stepIndex}
                steps={steps}
                tooltipComponent={OnboardingTooltip}
                styles={{
                    options: {
                        arrowColor: 'var(--color-background-surface)',
                        overlayColor,
                        primaryColor: 'var(--color-action-primary)',
                        zIndex: ONBOARDING_Z_INDEX.tooltip,
                    },
                    overlay: { transition: 'none' },
                    spotlight: {
                        border: '2px solid var(--color-action-primary)',
                        borderRadius: 'var(--radius-lg)',
                        transition: 'none',
                    },
                }}
            />
            {showChecklist && (
                <OnboardingChecklist
                    stepId={stepId}
                    status={status}
                    onResume={start}
                    onRestart={handleRestartRequested}
                    onDismiss={dismissChecklist}
                    hasInvokers={invokerCount > 0}
                />
            )}
        </>
    )
}
