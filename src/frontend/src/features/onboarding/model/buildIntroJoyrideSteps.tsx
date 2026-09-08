import type { Step } from 'react-joyride'
import { Trans } from 'react-i18next'
import { WelcomeContent } from '../ui/intro/WelcomeContent'
import { ThemeChoiceContent, ThemeFooterNote } from '../ui/intro/ThemeChoiceContent'
import { PaletteContent } from '../ui/intro/PaletteContent'
import { IntegrationLayersContent } from '../ui/intro/IntegrationLayersContent'
import { FirstInvokerContent } from '../ui/intro/FirstInvokerContent'
import { ExistingInvokersContent } from '../ui/intro/ExistingInvokersContent'
import type { OnboardingTooltipData } from '../ui/OnboardingTooltip'
import { ConnectorCreatedContent, ConnectorCredentialsContent, ConnectorGeneralContent } from '../ui/OnboardingConnectorContent'
import type { useI18n } from '@shared/i18n/hooks/useI18n'
import { OnboardingLicenseContent } from '../ui/OnboardingLicenseContent'
import { PALETTE_TOUR_TARGET } from './types'

type BuildIntroStepsOptions = {
    t: ReturnType<typeof useI18n<'onboarding'>>['t']
    userName: string
    includeInvokerStep: boolean
    includeConnectorSteps: boolean
    showInvokerTask: boolean
    paletteTargetMissing: boolean
    onCreateInvoker: () => void
    onInvokerUploaded: () => void
    onGitInvokersDownloaded: () => void
    onSkipInvoker: () => void
    invokers: Array<{ name: string; methodCount: number; requiredData: Record<string, string> }>
    onShowInvokerAnyway: () => void
    onSkipTask: () => void
    onSkipConnector: () => void
    connectorDraft: { title: string; description: string; invoker: string; timeout: number; requestData: Record<string, string>; saveStatus: 'idle' | 'error' }
    onConnectorTitleChange: (value: string) => void
    onConnectorDescriptionChange: (value: string) => void
    onConnectorInvokerChange: (value: string) => void
    onConnectorTimeoutChange: (value: number) => void
    onConnectorCredentialChange: (key: string, value: string) => void
    onConnectorBack: () => void
    onTestConnector: () => Promise<'success' | 'error'>
    onSaveConnector: () => Promise<void>
    connectorSaving: boolean
    onFinishDashboard: () => void
    onRemindLicense: () => void
    onFinishLicense: () => void
}

// Each step declares everything except `total`, which is stamped on below once
// the array is final — which steps exist depends on the user's INVOKER/CONNECTOR
// create permissions, so the count cannot be a literal.
type PartialTooltipData = Omit<OnboardingTooltipData, 'total'>

function data(value: PartialTooltipData): PartialTooltipData {
    return value
}

export function buildIntroJoyrideSteps({ t, userName, includeInvokerStep, includeConnectorSteps, showInvokerTask, paletteTargetMissing, onCreateInvoker, onInvokerUploaded, onGitInvokersDownloaded, onSkipInvoker, invokers, onShowInvokerAnyway, onSkipTask, onSkipConnector, connectorDraft, onConnectorTitleChange, onConnectorDescriptionChange, onConnectorInvokerChange, onConnectorTimeoutChange, onConnectorCredentialChange, onConnectorBack, onTestConnector, onSaveConnector, connectorSaving, onFinishDashboard, onRemindLicense, onFinishLicense }: BuildIntroStepsOptions): Step[] {
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
            target: paletteTargetMissing ? 'body' : PALETTE_TOUR_TARGET,
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
            content: hasInvokers ? <ExistingInvokersContent invokers={invokers} /> : <FirstInvokerContent onCreateManually={onCreateInvoker} onUploaded={onInvokerUploaded} onGitDownloaded={onGitInvokersDownloaded} />,
            data: data(hasInvokers
                ? { kicker: t('steps.invoker.kicker'), kind: 'skipped', badge: t('badges.skipped'), secondaryLabel: t('actions.showAnyway'), secondaryAction: onShowInvokerAnyway, primaryLabel: t('actions.continue'), footerNote: t('steps.invoker.skippedNote') }
                : { kicker: t('steps.invoker.kicker'), kind: 'blocking', variant: 'invoker', hideAccent: true, secondaryLabel: t('actions.later'), secondaryAction: onSkipInvoker, footerNote: t('steps.invoker.note') }),
        })
    }

    if (includeConnectorSteps) {
        steps.push(
            {
                target: 'body', placement: 'center', disableBeacon: true, disableOverlay: true,
                title: t('steps.connectorGeneral.title'),
                content: <ConnectorGeneralContent title={connectorDraft.title} description={connectorDraft.description} invoker={connectorDraft.invoker} timeout={connectorDraft.timeout} invokers={invokers.map(item => item.name)} onTitleChange={onConnectorTitleChange} onDescriptionChange={onConnectorDescriptionChange} onInvokerChange={onConnectorInvokerChange} onTimeoutChange={onConnectorTimeoutChange} />,
                data: data({ kicker: t('steps.connectorGeneral.kicker'), kind: 'blocking', secondaryLabel: t('actions.skipStep'), secondaryAction: onSkipConnector, footerNote: t('steps.connectorGeneral.note'), primaryDisabled: !connectorDraft.title.trim() || !connectorDraft.invoker }),
            },
            {
                target: 'body', placement: 'center', disableBeacon: true, disableOverlay: true,
                title: t('steps.credentials.title'),
                content: <ConnectorCredentialsContent title={connectorDraft.title} invoker={connectorDraft.invoker} requestData={connectorDraft.requestData} saveStatus={connectorDraft.saveStatus} onCredentialChange={onConnectorCredentialChange} onBack={onConnectorBack} onTest={onTestConnector} onSubmit={onSaveConnector} saving={connectorSaving} />,
                data: data({ kicker: t('steps.credentials.kicker'), kind: connectorDraft.saveStatus === 'error' ? 'error' : 'blocking', hideBack: true, hidePrimary: true, secondaryLabel: t('actions.skipStep'), secondaryAction: onSkipConnector, footerNote: connectorDraft.saveStatus === 'error' ? t('steps.credentials.saveFailedNote') : t('steps.credentials.failedTestNote') }),
            },
            {
                target: 'body', placement: 'center', disableBeacon: true,
                content: <ConnectorCreatedContent title={connectorDraft.title} methodCount={invokers.find(item => item.name === connectorDraft.invoker)?.methodCount ?? 0} />,
                data: data({ kicker: t('steps.created.kicker'), kind: 'done', variant: 'created', hideHeader: true, hideAccent: true, secondaryLabel: t('actions.dashboard'), secondaryAction: onFinishDashboard, primaryLabel: t('actions.next') }),
            },
        )
    }

    steps.push({
        target: 'body', placement: 'center', disableBeacon: true,
        title: t('steps.license.title'),
        content: <OnboardingLicenseContent />,
        data: data({ kicker: t('steps.license.kicker'), kind: 'info', secondaryLabel: t('actions.remindLater'), secondaryAction: onRemindLicense, primaryLabel: t('actions.finish'), primaryAction: onFinishLicense }),
    })

    return steps.map(step => ({
        ...step,
        data: { ...(step.data as PartialTooltipData), total: steps.length } satisfies OnboardingTooltipData,
    }))
}
