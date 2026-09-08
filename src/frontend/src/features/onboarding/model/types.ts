// Single source of truth for the tour's step order. `OnboardingStepId` is
// derived from it, so adding a step here is enough — the union, the checklist's
// milestone lookup and the Joyride index mapping all follow.
export const ONBOARDING_STEP_ORDER = [
    'welcome',
    'theme',
    'palette',
    'invoker-explainer',
    'invoker',
    'connector-general',
    'connector-credentials',
    'connector-created',
    'license',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_ORDER)[number]

/** Cross-module contract: systemCommands dispatches this to restart the tour. */
export const ONBOARDING_RESTART_EVENT = 'opencelium:onboarding:restart'

/**
 * The tour paints over everything, including globally-hosted dialogs. One ladder,
 * kept here so the three layers can't drift apart: cut-out backdrop sits just under
 * Joyride's own tooltip, and the checklist stays clickable above both.
 */
export const ONBOARDING_Z_INDEX = { backdrop: 20199, tooltip: 20200, checklist: 20300 } as const

/** Selector of the element the palette step spotlights, owned by CommandPalette. */
export const PALETTE_TOUR_TARGET = '[data-testid="command-palette-tour-target"]'

export type OnboardingStatus = 'idle' | 'running' | 'paused' | 'tour-complete' | 'completed'

export type OnboardingStepKind = 'info' | 'theme' | 'blocking' | 'skipped' | 'error' | 'done'

export type PersistedOnboardingState = {
    userId: number
    stepId: OnboardingStepId
    status: OnboardingStatus
    checklistDismissed: boolean
}
