import { useCallback, useMemo, useState } from 'react'
import type { Step } from 'react-joyride'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth/useAuth'
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { buildIntroJoyrideSteps } from './buildIntroJoyrideSteps'
import { useOnboardingStore } from './onboarding.store'
import { useConnectorDraft } from './useConnectorDraft'
import { DEFAULT_CREDENTIAL_FIELDS } from './onboardingApi'
import { ONBOARDING_STEP_ORDER, type OnboardingStepId } from './types'

// STUB: "download from git" is not implemented. FirstInvokerContent fakes the
// fetch with a timer and this splices a placeholder invoker into the list so the
// connector step has something to select. The name below is what the user then
// sees and what gets POSTed as `invoker.name` — it will not resolve on the
// backend. Replace both halves with a real invoker-repository fetch.
const STUB_GIT_INVOKER = { name: 'jira.xml', methodCount: 42, requiredData: { ...DEFAULT_CREDENTIAL_FIELDS } }

const DASHBOARD_ROUTE = '/'
const INVOKER_CREATE_ROUTE = '/invoker/create'

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
    const { data: invokers = [] } = useGetInvokersQuery(undefined, { skip: !isAdmin })

    const invokerSummaries = useMemo(
        () => [
            ...invokers.map(invoker => ({
                name: invoker.name,
                methodCount: invoker.operations?.length ?? 0,
                requiredData: invoker.requiredData ?? {},
            })),
            ...(mockGitInvokerLoaded ? [STUB_GIT_INVOKER] : []),
        ],
        [invokers, mockGitInvokerLoaded],
    )
    const includeConnectorSteps = canCreateConnector && (canCreateInvoker || invokers.length > 0)
    const activeStepIds: OnboardingStepId[] = useMemo(() => ONBOARDING_STEP_ORDER.filter(id => {
        if (id === 'invoker') return canCreateInvoker
        if (id.startsWith('connector-')) return includeConnectorSteps
        return true
    }), [canCreateInvoker, includeConnectorSteps])

    const goToIndex = useCallback((index: number) => {
        const bounded = Math.max(0, Math.min(index, activeStepIds.length - 1))
        setStepIndex(bounded)
        goTo(activeStepIds[bounded])
    }, [activeStepIds, goTo])
    const advance = useCallback(() => goToIndex(stepIndex + 1), [goToIndex, stepIndex])
    const goBack = useCallback(() => goToIndex(stepIndex - 1), [goToIndex, stepIndex])
    const skipConnector = useCallback(() => {
        const finalIndex = activeStepIds.indexOf('connector-created')
        if (finalIndex >= 0) goToIndex(finalIndex)
    }, [activeStepIds, goToIndex])

    const connector = useConnectorDraft({ invokers, onSaved: advance })
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
        onGitInvokersDownloaded: () => {
            setMockGitInvokerLoaded(true)
            advance()
        },
        onSkipInvoker: advance,
        onShowInvokerAnyway: () => setShowInvokerAnyway(true),
        onSkipTask: finishTour,
        onSkipConnector: skipConnector,
        connectorDraft: connector.draft,
        onConnectorTitleChange: title => connector.edit({ title }),
        onConnectorDescriptionChange: description => connector.edit({ description }),
        onConnectorTimeoutChange: timeout => connector.edit({ timeout }),
        onConnectorInvokerChange: connector.setInvoker,
        onConnectorCredentialChange: connector.setCredential,
        onConnectorBack: goBack,
        onTestConnector: connector.test,
        connectorSaving: connector.saving,
        onSaveConnector: connector.save,
        onFinishDashboard: () => {
            finishTour()
            void navigate(DASHBOARD_ROUTE)
        },
        onRemindLicense: () => {
            finishTour()
            void navigate(DASHBOARD_ROUTE)
        },
        onFinishLicense: () => {
            complete()
            void navigate(DASHBOARD_ROUTE)
        },
        onCreateInvoker: () => {
            pause()
            void navigate(INVOKER_CREATE_ROUTE)
        },
    }), [advance, canCreateInvoker, complete, connector, finishTour, goBack, includeConnectorSteps, invokerSummaries, navigate, paletteTargetMissing, pause, showInvokerAnyway, skipConnector, t, userName])

    const reset = useCallback(() => {
        setStepIndex(0)
        setShowInvokerAnyway(false)
        setMockGitInvokerLoaded(false)
        connector.reset()
    }, [connector])

    return { steps, stepIndex, setStepIndex, activeStepIds, advance, goToIndex, invokerCount: invokers.length, reset }
}
