// Single source of truth for the tour's step order. `OnboardingStepId` is
// derived from it, so adding a step here is enough — the union, the checklist's
// milestone lookup and the Joyride index mapping all follow.
export const ONBOARDING_STEP_ORDER = [
    'welcome',
    'theme',
    'license',
    'palette',
    'invoker-explainer',
    'invoker',
    'connector',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_ORDER)[number]

/**
 * The steps the tour presents as real setup work, in tour order. Shared so the
 * welcome step's phase list and the checklist cannot disagree about how many
 * there are — `welcome` and `invoker-explainer` are framing, not milestones.
 * `key` addresses both `content.welcome.<key>` and `checklist.<key>.*`.
 */
export const ONBOARDING_MILESTONES = [
    { id: 'theme', key: 'theme' },
    { id: 'license', key: 'license' },
    { id: 'palette', key: 'palette' },
    { id: 'invoker', key: 'invoker' },
    { id: 'connector', key: 'connector' },
] as const satisfies readonly { id: OnboardingStepId; key: string }[]

/** Cross-module contract: systemCommands dispatches this to restart the tour. */
export const ONBOARDING_RESTART_EVENT = 'opencelium:onboarding:restart'

/**
 * The tour paints over everything, including globally-hosted dialogs. One ladder,
 * kept here so the layers can't drift apart: the cut-out backdrop sits just under
 * Joyride's own tooltip, and the checklist stays clickable above both.
 *
 * `overlay` is the exception that has to sit *above* the tour: antd portals its
 * message (2010), notification (2050) and modal (1000) layers nowhere near these
 * values, so while the tour runs they are lifted to this one — see the
 * `.onboarding-tour-active` rules in onboardingTooltip.css.
 */
export const ONBOARDING_Z_INDEX = {
    backdrop: 20199,
    tooltip: 20200,
    checklist: 20300,
    /** The connector form docked beside the tour: above the tooltip, below dialogs. */
    sidePanel: 20350,
    overlay: 20400,
} as const

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
