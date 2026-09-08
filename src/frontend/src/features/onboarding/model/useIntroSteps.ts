import { useCallback, useMemo, useState } from 'react'
import type { Step } from 'react-joyride'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { buildIntroJoyrideSteps } from './buildIntroJoyrideSteps'
import { useOnboardingStore } from './onboarding.store'
import { useGetConnectorsMetaQuery } from '@entities/connector/api/connectorApi'
import { useGetActiveSubscriptionQuery } from '@entities/subscription/api/subscriptionApi'
import { ONBOARDING_STEP_ORDER, type OnboardingStepId } from './types'
import { buildConnectorCreateLink } from '@entities/connector/lib/connectorCreateLink'

// STUB: "download from git" is not implemented. FirstInvokerContent fakes the
// fetch with a timer and this splices a placeholder invoker into the tour's own
// view of the list, so the step can move on. It is display-only — nothing submits
// it, and the connector form reads the real list — but the user is shown an
// invoker that does not exist. Replace both halves with a real repository fetch.
const STUB_GIT_INVOKER = { name: 'jira.xml', description: '', methodCount: 42, connectorCount: 0, requiredData: { Url: '', Username: '', Password: '' } }

const LICENSE_ROUTE = '/license'
const INVOKER_CREATE_ROUTE = '/invoker/create'
const WORKFLOW_CREATE_ROUTE = '/workflow/create'

type IntroStepsOptions = {
    isAdmin: boolean
    canCreateInvoker: boolean
    canCreateConnector: boolean
    paletteTargetMissing: boolean
}

/**
 * Assembles the Joyride step list and owns the state those steps read from: which
 * steps the user's permissions allow, the position in that list, the connector
 * draft, and the two "act as if it worked" flags for the skipped/stubbed paths.
 */
export function useIntroSteps({ isAdmin, canCreateInvoker, canCreateConnector, paletteTargetMissing }: IntroStepsOptions) {
    const { t } = useI18n('onboarding')
    const { user } = useAuth()
    const navigate = useNavigate()
    const { complete, finishTour, goTo, pause } = useOnboardingStore()
    const [stepIndex, setStepIndex] = useState(0)
    const [showInvokerAnyway, setShowInvokerAnyway] = useState(false)
    const [mockGitInvokerLoaded, setMockGitInvokerLoaded] = useState(false)
    const { data: invokerList } = useGetInvokersQuery(undefined, { skip: !isAdmin })
    const { data: connectorList } = useGetConnectorsMetaQuery(undefined, { skip: !isAdmin })
    const { data: subscription } = useGetActiveSubscriptionQuery(undefined, { skip: !isAdmin })
    const invokers = useMemo(() => invokerList ?? [], [invokerList])

    // How many connectors already point at each invoker, from the same meta list the
    // resume watch uses — no extra request.
    const connectorsPerInvoker = useMemo(() => {
        const counts = new Map<string, number>()
        for (const connector of connectorList ?? []) {
            const name = connector.invoker?.name
            if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
        }
        return counts
    }, [connectorList])

    const invokerSummaries = useMemo(
        () => [
            ...invokers.map(invoker => ({
                name: invoker.name,
                description: invoker.description ?? '',
                methodCount: invoker.operations?.length ?? 0,
                connectorCount: connectorsPerInvoker.get(invoker.name) ?? 0,
                requiredData: invoker.requiredData ?? {},
            })),
            ...(mockGitInvokerLoaded ? [STUB_GIT_INVOKER] : []),
        ],
        [connectorsPerInvoker, invokers, mockGitInvokerLoaded],
    )
    const includeConnectorSteps = canCreateConnector && (canCreateInvoker || invokers.length > 0)
    const activeStepIds: OnboardingStepId[] = useMemo(() => ONBOARDING_STEP_ORDER.filter(id => {
        if (id === 'invoker') return canCreateInvoker
        if (id === 'connector') return includeConnectorSteps
        return true
    }), [canCreateInvoker, includeConnectorSteps])

    const goToIndex = useCallback((index: number) => {
        const bounded = Math.max(0, Math.min(index, activeStepIds.length - 1))
        setStepIndex(bounded)
        goTo(activeStepIds[bounded])
    }, [activeStepIds, goTo])
    const isLastStep = stepIndex >= activeStepIds.length - 1
    const advance = useCallback(() => {
        // Past the final step there is nothing to show, so advancing finishes.
        if (isLastStep) complete()
        else goToIndex(stepIndex + 1)
    }, [complete, goToIndex, isLastStep, stepIndex])

    const userName = user?.userDetail?.name || user?.username || t('content.welcome.anonymous')

    const steps: Step[] = useMemo(() => buildIntroJoyrideSteps({
        t,
        userName,
        includeInvokerStep: canCreateInvoker,
        includeConnectorSteps,
        showInvokerTask: showInvokerAnyway,
        paletteTargetMissing,
        invokers: invokerSummaries,
        onInvokerUploaded: advance,
        // Deliberately does not advance: the sync reports itself with a toast and
        // the user moves on when ready. The step re-renders as the "you already
        // have invokers" variant, which carries the Continue button.
        onGitInvokersDownloaded: () => setMockGitInvokerLoaded(true),
        onSkipInvoker: advance,
        onShowInvokerAnyway: () => setShowInvokerAnyway(true),
        onSkipTask: finishTour,
        onCreateConnectorFor: invokerName => {
            pause()
            void navigate(buildConnectorCreateLink(invokerName))
        },
        // Completing first means the route change below cannot re-pause the tour,
        // and the checklist shows every milestone done rather than "paused".
        onCreateWorkflow: () => {
            complete()
            void navigate(WORKFLOW_CREATE_ROUTE)
        },
        // Reaching the licence page is all this step asks for, so it advances on
        // the way out — the tour parks on the following step instead of asking
        // about the licence again. Activating one then just un-pauses it.
        onOpenLicensePage: () => {
            advance()
            pause()
            void navigate(LICENSE_ROUTE)
        },
        onCreateInvoker: () => {
            pause()
            void navigate(INVOKER_CREATE_ROUTE)
        },
    }), [advance, canCreateInvoker, complete, finishTour, includeConnectorSteps, invokerSummaries, navigate, paletteTargetMissing, pause, showInvokerAnyway, t, userName])

    const reset = useCallback(() => {
        setStepIndex(0)
        setShowInvokerAnyway(false)
        setMockGitInvokerLoaded(false)
    }, [])

    return {
        steps, stepIndex, setStepIndex, activeStepIds, advance, goToIndex, reset,
        stepAfterLicense: activeStepIds[activeStepIds.indexOf('license') + 1],
        licenseActive: subscription?.active === true,
        licenseLoaded: subscription !== undefined,
        invokerCount: invokers.length,
        invokersLoaded: invokerList !== undefined,
        connectorCount: connectorList?.length ?? 0,
        connectorsLoaded: connectorList !== undefined,
    }
}
