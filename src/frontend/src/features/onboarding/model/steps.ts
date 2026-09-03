import type { OnboardingStep, OnboardingStepId } from './types'

export type BuildOnboardingStepsOptions = {
    canCreateInvoker: boolean
    canCreateConnector: boolean
}

const INFO_STEPS: OnboardingStep[] = [
    { id: 'welcome', kind: 'info', route: '/' },
    { id: 'theme', kind: 'info', route: '/' },
    { id: 'palette', kind: 'info', route: '/', target: '[data-testid="command-palette-tour-target"]' },
    { id: 'invoker-explainer', kind: 'info', route: '/' },
]

const INVOKER_STEP: OnboardingStep = {
    id: 'invoker',
    kind: 'blocking',
    route: '/',
}

const CONNECTOR_STEPS: OnboardingStep[] = [
    { id: 'connector-general', kind: 'blocking', route: '/connector' },
    { id: 'connector-credentials', kind: 'blocking', route: '/connector' },
    { id: 'connector-created', kind: 'done', route: '/' },
]

export function buildOnboardingSteps({
    canCreateInvoker,
    canCreateConnector,
}: BuildOnboardingStepsOptions): OnboardingStep[] {
    const steps = [...INFO_STEPS]

    if (canCreateInvoker) steps.push(INVOKER_STEP)
    if (canCreateConnector) steps.push(...CONNECTOR_STEPS)

    return steps
}

export function findStepIndex(steps: OnboardingStep[], stepId: OnboardingStepId): number {
    const index = steps.findIndex(step => step.id === stepId)
    return index < 0 ? 0 : index
}
