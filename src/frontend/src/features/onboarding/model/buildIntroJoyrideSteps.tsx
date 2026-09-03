import type { Step } from 'react-joyride'
import { Trans } from 'react-i18next'
import {
    FirstInvokerContent,
    ExistingInvokersContent,
    IntegrationLayersContent,
    PaletteContent,
    ThemeChoiceContent,
    ThemeFooterNote,
    WelcomeContent,
} from '../ui/OnboardingIntroContent'
import type { OnboardingTooltipData } from '../ui/OnboardingTooltip'
import { ConnectorCreatedContent, ConnectorCredentialsContent, ConnectorGeneralContent } from '../ui/OnboardingConnectorContent'
import type { useI18n } from '@shared/i18n/hooks/useI18n'

type BuildIntroStepsOptions = {
    t: ReturnType<typeof useI18n<'onboarding'>>['t']
    userName: string
    includeInvokerStep: boolean
    includeConnectorSteps: boolean
    showInvokerTask: boolean
    paletteTargetMissing: boolean
    onCreateInvoker: () => void
    onInvokerUploaded: () => void
    onSkipInvoker: () => void
    invokers: Array<{ name: string; methodCount: number; requiredData: Record<string, string> }>
    onShowInvokerAnyway: () => void
    onSkipTask: () => void
    connectorDraft: { title: string; invoker: string; requestData: Record<string, string>; testStatus: 'idle' | 'loading' | 'success' | 'error'; saveStatus: 'idle' | 'error' }
    onConnectorTitleChange: (value: string) => void
    onConnectorInvokerChange: (value: string) => void
    onConnectorCredentialChange: (key: string, value: string) => void
    onConnectorBack: () => void
    onTestConnector: () => Promise<void>
    onSaveConnector: () => Promise<void>
    connectorSaving: boolean
    onBuildWorkflow: () => void
    onFinishDashboard: () => void
}

function data(value: OnboardingTooltipData): OnboardingTooltipData {
    return { total: 8, ...value }
}

export function buildIntroJoyrideSteps({ t, userName, includeInvokerStep, includeConnectorSteps, showInvokerTask, paletteTargetMissing, onCreateInvoker, onInvokerUploaded, onSkipInvoker, invokers, onShowInvokerAnyway, onSkipTask, connectorDraft, onConnectorTitleChange, onConnectorInvokerChange, onConnectorCredentialChange, onConnectorBack, onTestConnector, onSaveConnector, connectorSaving, onBuildWorkflow, onFinishDashboard }: BuildIntroStepsOptions): Step[] {
    const restartNote = <Trans ns="onboarding" i18nKey="notes.restart" components={{ code: <code /> }} />
    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.welcome.title', { name: userName }),
            content: <WelcomeContent userName={userName} />,
            data: data({ kicker: t('steps.welcome.kicker'), brand: true, primaryLabel: t('actions.showAround'), secondaryLabel: t('actions.skipForNow'), secondaryAction: onSkipTask, footerNote: restartNote }),
        },
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.theme.title'),
            content: <ThemeChoiceContent />,
            data: data({ kicker: t('steps.theme.kicker'), kind: 'theme', hideSecondary: true, footerNote: <ThemeFooterNote /> }),
        },
        {
            target: paletteTargetMissing ? 'body' : '[data-testid="command-palette-tour-target"]',
            placement: paletteTargetMissing ? 'center' : 'bottom',
            disableBeacon: true,
            spotlightPadding: 8,
            title: t('steps.palette.title'),
            content: <PaletteContent />,
            data: data({ kicker: t('steps.palette.kicker'), secondaryAction: onSkipTask, footerNote: t('steps.palette.note') }),
        },
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.layers.title'),
            content: <IntegrationLayersContent />,
            data: data({ kicker: t('steps.layers.kicker'), secondaryAction: onSkipTask, footerNote: t('steps.layers.note') }),
        },
    ]

    if (includeInvokerStep) {
        const hasInvokers = invokers.length > 0 && !showInvokerTask
        steps.push({
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: hasInvokers ? t('steps.invoker.existingTitle', { count: invokers.length }) : t('steps.invoker.emptyTitle'),
            content: hasInvokers ? <ExistingInvokersContent invokers={invokers} /> : <FirstInvokerContent onCreateManually={onCreateInvoker} onUploaded={onInvokerUploaded} />,
            data: data(hasInvokers
                ? { kicker: t('steps.invoker.kicker'), kind: 'skipped', badge: t('badges.skipped'), hideBack: true, secondaryLabel: t('actions.showAnyway'), secondaryAction: onShowInvokerAnyway, primaryLabel: t('actions.continue'), footerNote: t('steps.invoker.skippedNote') }
                : { kicker: t('steps.invoker.kicker'), kind: 'blocking', variant: 'invoker', hideAccent: true, hideBack: true, secondaryLabel: t('actions.later'), secondaryAction: onSkipInvoker, footerNote: <>Not now? {t('steps.invoker.note')}</> }),
        })
    }

    if (includeConnectorSteps) {
        steps.push(
            {
                target: 'body', placement: 'center', disableBeacon: true, disableOverlay: true,
                title: t('steps.connectorGeneral.title'),
                content: <ConnectorGeneralContent title={connectorDraft.title} invoker={connectorDraft.invoker} invokers={invokers.map(item => item.name)} onTitleChange={onConnectorTitleChange} onInvokerChange={onConnectorInvokerChange} />,
                data: data({ kicker: t('steps.connectorGeneral.kicker'), kind: 'blocking', hideBack: true, secondaryLabel: t('actions.skipStep'), secondaryAction: onSkipTask, footerNote: t('steps.connectorGeneral.note'), primaryDisabled: !connectorDraft.title.trim() || !connectorDraft.invoker }),
            },
            {
                target: 'body', placement: 'center', disableBeacon: true, disableOverlay: true,
                title: t('steps.credentials.title'),
                content: <ConnectorCredentialsContent title={connectorDraft.title} invoker={connectorDraft.invoker} requestData={connectorDraft.requestData} testStatus={connectorDraft.testStatus} saveStatus={connectorDraft.saveStatus} onCredentialChange={onConnectorCredentialChange} onBack={onConnectorBack} onTest={onTestConnector} onSubmit={onSaveConnector} saving={connectorSaving} />,
                data: data({ kicker: t('steps.credentials.kicker'), kind: connectorDraft.testStatus === 'error' || connectorDraft.saveStatus === 'error' ? 'error' : 'blocking', hideBack: true, secondaryLabel: t('actions.skipStep'), secondaryAction: onSkipTask, footerNote: connectorDraft.saveStatus === 'error' ? t('steps.credentials.saveFailedNote') : 'A failed test still lets you save', primaryDisabled: connectorSaving || !['success', 'error'].includes(connectorDraft.testStatus), primaryLabel: connectorDraft.saveStatus === 'error' ? t('actions.retrySave') : connectorDraft.testStatus === 'error' ? t('actions.saveAnyway') : t('actions.next'), primaryAction: onSaveConnector }),
            },
            {
                target: 'body', placement: 'center', disableBeacon: true,
                content: <ConnectorCreatedContent title={connectorDraft.title} methodCount={invokers.find(item => item.name === connectorDraft.invoker)?.methodCount ?? 0} />,
                data: data({ kicker: t('steps.created.kicker'), kind: 'done', variant: 'created', hideHeader: true, hideAccent: true, hideBack: true, secondaryLabel: t('actions.dashboard'), secondaryAction: onFinishDashboard, primaryLabel: t('actions.buildWorkflow'), primaryAction: onBuildWorkflow }),
            },
        )
    }

    return steps
}
