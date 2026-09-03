export type OnboardingStepId =
    | 'welcome'
    | 'theme'
    | 'palette'
    | 'invoker-explainer'
    | 'invoker'
    | 'connector-general'
    | 'connector-credentials'
    | 'connector-created'

export type OnboardingStatus = 'idle' | 'running' | 'paused' | 'tour-complete' | 'completed'

export type OnboardingStepKind = 'info' | 'theme' | 'blocking' | 'skipped' | 'error' | 'done'

export type OnboardingStep = {
    id: OnboardingStepId
    kind: OnboardingStepKind
    route: string
    target?: string
}

export type PersistedOnboardingState = {
    userId: number
    stepId: OnboardingStepId
    status: OnboardingStatus
    checklistDismissed: boolean
}
