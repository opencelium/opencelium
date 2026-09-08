import type { Step } from 'react-joyride'
import { WelcomeContent } from '../ui/intro/WelcomeContent'
import { ThemeChoiceContent } from '../ui/intro/ThemeChoiceContent'
import { PaletteContent } from '../ui/intro/PaletteContent'
import { IntegrationLayersContent } from '../ui/intro/IntegrationLayersContent'
import { FirstInvokerContent } from '../ui/intro/FirstInvokerContent'
import { ExistingInvokersContent } from '../ui/intro/ExistingInvokersContent'
import { ConnectorStepContent } from '../ui/intro/ConnectorStepContent'
import type { OnboardingTooltipData } from '../ui/OnboardingTooltip'
import type { useI18n } from '@shared/i18n/hooks/useI18n'
import { OnboardingLicenseContent } from '../ui/OnboardingLicenseContent'
import { PALETTE_TOUR_TARGET } from './types'
import { CommandHint } from '../ui/CommandHint'

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
    invokers: Array<{ name: string; description: string; methodCount: number; connectorCount: number; requiredData: Record<string, string> }>
    onShowInvokerAnyway: () => void
    onSkipTask: () => void
    onCreateConnectorFor: (invokerName: string) => void
    onCreateWorkflow: () => void
    onOpenLicensePage: () => void
}

/**
 * Palette commands each step points at, so the user can repeat its task later.
 * All verified against the registered command trees — note the palette is
 * verb-first (`create connector`), not object-first.
 */
const COMMANDS = {
    restart: 'help onboarding',
    theme: 'ui theme',
    license: 'check license',
    invoker: 'upload invoker',
    connector: 'create connector',
} as const

// Each step declares everything except `total`, which is stamped on below once
// the array is final — which steps exist depends on the user's INVOKER/CONNECTOR
// create permissions, so the count cannot be a literal.
type PartialTooltipData = Omit<OnboardingTooltipData, 'total'>

function data(value: PartialTooltipData): PartialTooltipData {
    return value
}

export function buildIntroJoyrideSteps({ t, userName, includeInvokerStep, includeConnectorSteps, showInvokerTask, paletteTargetMissing, onCreateInvoker, onInvokerUploaded, onGitInvokersDownloaded, onSkipInvoker, invokers, onShowInvokerAnyway, onSkipTask, onCreateConnectorFor, onCreateWorkflow, onOpenLicensePage }: BuildIntroStepsOptions): Step[] {
    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.welcome.title', { name: userName }),
            content: <WelcomeContent userName={userName} />,
            data: data({ kicker: t('steps.welcome.kicker'), brand: true, primaryLabel: t('actions.showAround'), secondaryLabel: t('actions.skipForNow'), secondaryAction: onSkipTask, footerNote: <CommandHint command={COMMANDS.restart} /> }),
        },
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.theme.title'),
            content: <ThemeChoiceContent />,
            data: data({ kicker: t('steps.theme.kicker'), kind: 'theme', footerNote: <CommandHint command={COMMANDS.theme} /> }),
        },
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.license.title'),
            content: <OnboardingLicenseContent onOpenLicensePage={onOpenLicensePage} />,
            data: data({ kicker: t('steps.license.kicker'), kind: 'info', footerNote: <CommandHint command={COMMANDS.license} /> }),
        },
        {
            target: paletteTargetMissing ? 'body' : PALETTE_TOUR_TARGET,
            placement: paletteTargetMissing ? 'center' : 'bottom',
            disableBeacon: true,
            spotlightPadding: 8,
            title: t('steps.palette.title'),
            content: <PaletteContent />,
            data: data({ kicker: t('steps.palette.kicker') }),
        },
        {
            target: 'body',
            placement: 'center',
            disableBeacon: true,
            title: t('steps.layers.title'),
            content: <IntegrationLayersContent />,
            data: data({ kicker: t('steps.layers.kicker'), footerNote: t('steps.layers.note') }),
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
                ? { kicker: t('steps.invoker.kicker'), kind: 'skipped', badge: t('badges.skipped'), secondaryLabel: t('actions.addAnotherInvoker'), secondaryAction: onShowInvokerAnyway, footerNote: <CommandHint command={COMMANDS.invoker} /> }
                : { kicker: t('steps.invoker.kicker'), kind: 'blocking', variant: 'invoker', secondaryLabel: t('actions.later'), secondaryAction: onSkipInvoker, footerNote: <CommandHint command={COMMANDS.invoker} /> }),
        })
    }

    if (includeConnectorSteps) {
        steps.push({
            target: 'body', placement: 'center', disableBeacon: true,
            title: t('steps.connector.title'),
            content: <ConnectorStepContent invokers={invokers} onCreateConnectorFor={onCreateConnectorFor} />,
            data: data({
                kicker: t('steps.connector.kicker'),
                kind: 'blocking',
                footerNote: <CommandHint command={COMMANDS.connector} />,
                // The tour's last step hands off to the thing connectors exist for.
                primaryLabel: t('actions.createWorkflow'),
                primaryAction: onCreateWorkflow,
            }),
        })
    }

    return steps.map(step => ({
        ...step,
        data: { ...(step.data as PartialTooltipData), total: steps.length } satisfies OnboardingTooltipData,
    }))
}
