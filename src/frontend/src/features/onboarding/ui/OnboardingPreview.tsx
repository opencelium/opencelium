import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride'
import type { CallBackProps } from 'react-joyride'
import { useLocation, useNavigate } from 'react-router-dom'
import { hasComponentPermission } from '@/engine/policy'
import { useAuth } from '@features/auth/useAuth'
import { useIsAdmin } from '@features/auth/useIsAdmin'
import { useTheme } from '@shared/theme/hooks/useTheme'
import { buildIntroJoyrideSteps } from '../model/buildIntroJoyrideSteps'
import { useOnboardingStore } from '../model/onboarding.store'
import { OnboardingTooltip } from './OnboardingTooltip'
import { OnboardingChecklist } from './OnboardingChecklist'
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi'
import { useI18n } from '@shared/i18n/hooks/useI18n'
import { useCheckOnboardingConnectorMutation, useCreateOnboardingConnectorMutation } from '../model/onboardingApi'

const STEP_IDS = ['welcome', 'theme', 'palette', 'invoker-explainer', 'invoker', 'connector-general', 'connector-credentials', 'connector-created'] as const

/**
 * Frontend-only first-login entry point. `?onboarding=1` remains available for QA.
 */
export function OnboardingPreview() {
    const { t } = useI18n('onboarding')
    const { user, normalizedUser } = useAuth()
    const isAdmin = useIsAdmin()
    const { themeMode } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const previousPathRef = useRef(location.pathname)
    const allowNextRouteChangeRef = useRef(false)
    const [stepIndex, setStepIndex] = useState(0)
    const [showInvokerAnyway, setShowInvokerAnyway] = useState(false)
    const [paletteTargetMissing, setPaletteTargetMissing] = useState(false)
    const [connectorDraft, setConnectorDraft] = useState({ title: '', invoker: '', requestData: {} as Record<string, string>, testStatus: 'idle' as 'idle' | 'loading' | 'success' | 'error', saveStatus: 'idle' as 'idle' | 'error' })
    const [checkConnector] = useCheckOnboardingConnectorMutation()
    const [createConnector, { isLoading: connectorSaving }] = useCreateOnboardingConnectorMutation()
    const { checklistDismissed, complete, dismissChecklist, finishTour, hydrate, hydrated, pause, restart, start, status, stepId, goTo } = useOnboardingStore()

    const previewRequested = new URLSearchParams(location.search).get('onboarding') === '1'
    const canCreateInvoker = hasComponentPermission(normalizedUser?.permissions ?? [], 'INVOKER', 'CREATE')
    const canCreateConnector = hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTOR', 'CREATE')
    const { data: invokers = [] } = useGetInvokersQuery(undefined, { skip: !isAdmin })
    const invokerSummaries = useMemo(
        () => invokers.map(invoker => ({ name: invoker.name, methodCount: invoker.operations?.length ?? 0, requiredData: invoker.requiredData ?? {} })),
        [invokers],
    )
    const name = user?.userDetail?.name || user?.username || 'there'
    const includeConnectorSteps = canCreateConnector && (canCreateInvoker || invokers.length > 0)
    const activeStepIds = useMemo(() => STEP_IDS.filter(id => {
        if (id === 'invoker') return canCreateInvoker
        if (id.startsWith('connector-')) return includeConnectorSteps
        return true
    }), [canCreateInvoker, includeConnectorSteps])

    const advanceWithoutCompleting = useCallback(() => {
        const nextIndex = Math.min(stepIndex + 1, activeStepIds.length - 1)
        setStepIndex(nextIndex)
        goTo(activeStepIds[nextIndex])
    }, [activeStepIds, goTo, stepIndex])
    const goBackWithoutCompleting = useCallback(() => {
        const previousIndex = Math.max(stepIndex - 1, 0)
        setStepIndex(previousIndex)
        goTo(activeStepIds[previousIndex])
    }, [activeStepIds, goTo, stepIndex])

    const steps = useMemo(() => buildIntroJoyrideSteps({
        t,
        userName: name,
        includeInvokerStep: canCreateInvoker,
        includeConnectorSteps,
        showInvokerTask: showInvokerAnyway,
        paletteTargetMissing,
        invokers: invokerSummaries,
        onInvokerUploaded: advanceWithoutCompleting,
        onSkipInvoker: advanceWithoutCompleting,
        onShowInvokerAnyway: () => setShowInvokerAnyway(true),
        onSkipTask: finishTour,
        connectorDraft,
        onConnectorTitleChange: title => setConnectorDraft(current => ({ ...current, title, testStatus: 'idle', saveStatus: 'idle' })),
        onConnectorInvokerChange: invokerName => {
            const requiredData = invokers.find(item => item.name === invokerName)?.requiredData ?? {}
            const requestData = Object.keys(requiredData).length > 0
                ? { ...requiredData }
                : { Url: '', Username: '', Password: '' }
            setConnectorDraft(current => ({ ...current, invoker: invokerName, requestData, testStatus: 'idle', saveStatus: 'idle' }))
        },
        onConnectorCredentialChange: (key, value) => setConnectorDraft(current => ({ ...current, requestData: { ...current.requestData, [key]: value }, testStatus: 'idle', saveStatus: 'idle' })),
        onConnectorBack: goBackWithoutCompleting,
        onTestConnector: async () => {
            setConnectorDraft(current => ({ ...current, testStatus: 'loading', saveStatus: 'idle' }))
            try {
                const response = await checkConnector({ title: connectorDraft.title, description: '', timeout: 30, sslCert: false, invoker: { name: connectorDraft.invoker }, requestData: connectorDraft.requestData }).unwrap()
                const success = String(response.status) === '200'
                setConnectorDraft(current => ({ ...current, testStatus: success ? 'success' : 'error' }))
            } catch {
                setConnectorDraft(current => ({ ...current, testStatus: 'error' }))
            }
        },
        connectorSaving,
        onSaveConnector: async () => {
            setConnectorDraft(current => ({ ...current, saveStatus: 'idle' }))
            try {
                const created = await createConnector({ title: connectorDraft.title, description: '', timeout: 30, sslCert: false, invoker: { name: connectorDraft.invoker }, requestData: connectorDraft.requestData }).unwrap()
                if (!created?.connectorId) throw new Error('Connector was not created')
                advanceWithoutCompleting()
            } catch {
                setConnectorDraft(current => ({ ...current, saveStatus: 'error' }))
            }
        },
        onFinishDashboard: () => {
            finishTour()
            void navigate('/')
        },
        onBuildWorkflow: () => {
            finishTour()
            allowNextRouteChangeRef.current = true
            void navigate('/workflow/create')
        },
        onCreateInvoker: () => {
            pause()
            void navigate('/invoker/create')
        },
    }), [advanceWithoutCompleting, canCreateInvoker, checkConnector, connectorDraft, connectorSaving, createConnector, finishTour, goBackWithoutCompleting, includeConnectorSteps, invokerSummaries, invokers, name, navigate, paletteTargetMissing, pause, showInvokerAnyway, t])

    useEffect(() => {
        if (!user?.userId) return
        hydrate(user.userId)
    }, [hydrate, user?.userId])

    useEffect(() => {
        if (!hydrated || !isAdmin) return
        if (previewRequested || status === 'idle') start()
    }, [hydrated, isAdmin, previewRequested, start, status])

    useEffect(() => {
        if (!hydrated) return
        const restoredIndex = activeStepIds.indexOf(stepId)
        setStepIndex(restoredIndex >= 0 ? restoredIndex : 0)
    }, [activeStepIds, hydrated, stepId])

    useEffect(() => {
        if (!isAdmin) return
        const handleRestart = () => {
            allowNextRouteChangeRef.current = true
            setStepIndex(0)
            setShowInvokerAnyway(false)
            setPaletteTargetMissing(false)
            setConnectorDraft({ title: '', invoker: '', requestData: {}, testStatus: 'idle', saveStatus: 'idle' })
            restart()
        }
        window.addEventListener('opencelium:onboarding:restart', handleRestart)
        return () => window.removeEventListener('opencelium:onboarding:restart', handleRestart)
    }, [isAdmin, restart])

    useEffect(() => {
        if (previousPathRef.current === location.pathname) return
        previousPathRef.current = location.pathname

        if (allowNextRouteChangeRef.current) {
            allowNextRouteChangeRef.current = false
            return
        }
        if (status === 'running') pause()
    }, [location.pathname, pause, status])

    const handleCallback = ({ action, index, status: joyrideStatus, type }: CallBackProps) => {
        if (type === EVENTS.TARGET_NOT_FOUND) {
            const currentId = activeStepIds[index]
            if (currentId === 'palette') setPaletteTargetMissing(true)
            return
        }

        if (action === ACTIONS.CLOSE || joyrideStatus === STATUS.SKIPPED) {
            finishTour()
            return
        }

        if (type === EVENTS.STEP_AFTER) {
            const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1
            const boundedIndex = Math.max(0, Math.min(nextIndex, steps.length - 1))
            setStepIndex(boundedIndex)
            const nextId = activeStepIds[boundedIndex]
            if (nextId) goTo(nextId)
        }

        if (joyrideStatus === STATUS.FINISHED) complete()
    }

    useEffect(() => {
        if (status !== 'running') return
        const handleTourKeys = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (target?.matches('input, textarea, select, button, [contenteditable="true"]')) return
            if (stepId === 'welcome' && (event.key === 'Enter' || event.key === 'ArrowRight')) {
                event.preventDefault()
                advanceWithoutCompleting()
            }
            if (stepId === 'palette' && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                advanceWithoutCompleting()
            }
        }
        window.addEventListener('keydown', handleTourKeys)
        return () => window.removeEventListener('keydown', handleTourKeys)
    }, [advanceWithoutCompleting, status, stepId])

    return (
        <>
        <Joyride
            callback={handleCallback}
            continuous
            disableOverlayClose
            floaterProps={{ disableAnimation: true }}
            hideCloseButton
            run={hydrated && isAdmin && status === 'running'}
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
                    zIndex: 20200,
                },
                spotlight: {
                    border: '2px solid var(--color-action-primary)',
                    borderRadius: 10,
                },
            }}
        />
        {hydrated && isAdmin && status !== 'completed' && !checklistDismissed && !location.pathname.startsWith('/workflow/') && (
            <OnboardingChecklist
                stepId={stepId}
                status={status}
                onResume={start}
                onRestart={() => { setStepIndex(0); setPaletteTargetMissing(false); restart() }}
                onDismiss={dismissChecklist}
                hasInvokers={invokers.length > 0}
            />
        )}
        </>
    )
}
