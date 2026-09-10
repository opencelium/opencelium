import type { Step } from 'react-joyride'
import { PALETTE_TOUR_TARGET } from '../../model/types'

/** Palette command that replays the tour, shown in the first step's footer. */
export const DASHBOARD_TOUR_COMMAND = 'help dashboard'

/** Ring drawn around a spotlit widget, in px. */
export const SPOTLIGHT_PADDING = 6

type DashboardStepDefinition = {
    /** Addresses both the step's target and its `dashboard.steps.<id>` copy. */
    id: string
    placement: Step['placement']
    /** Whether the step's footer carries a `<id>.note` hint of its own. */
    hasNote: boolean
}

/**
 * Tour order: the page first, then the chrome above it that follows the user
 * everywhere. Every target is an element some component owns as a stable test id,
 * so a renamed widget internal cannot break the tour.
 *
 * The top-bar steps end `-end`/`-start`-placed because the bar spans the whole
 * width — a centred tooltip on the profile icon would hang off the viewport.
 */
export const DASHBOARD_TOUR_STEPS = [
    { id: 'header', placement: 'bottom', hasNote: false },
    { id: 'tiles', placement: 'bottom', hasNote: false },
    { id: 'executions', placement: 'auto', hasNote: true },
    { id: 'resources', placement: 'auto', hasNote: false },
    { id: 'connectors', placement: 'auto', hasNote: false },
    { id: 'comingSoon', placement: 'top', hasNote: false },
    { id: 'createWorkflow', placement: 'bottom-start', hasNote: false },
    { id: 'palette', placement: 'bottom', hasNote: false },
    { id: 'language', placement: 'bottom-end', hasNote: false },
    { id: 'help', placement: 'bottom-end', hasNote: false },
    { id: 'menuSwitch', placement: 'bottom-end', hasNote: false },
    { id: 'profile', placement: 'bottom-end', hasNote: false },
] as const satisfies readonly DashboardStepDefinition[]

export type DashboardTourStepId = (typeof DASHBOARD_TOUR_STEPS)[number]['id']

/**
 * The anchor that says the dashboard itself has rendered. The top bar is mounted
 * by the layout and is therefore on screen *before* the page is, so resolving
 * targets on the first anchor found would snapshot a chrome-only tour.
 */
export const READY_STEP_ID: DashboardTourStepId = 'header'

const anchor = (testId: string) => `[data-testid="${testId}"]`

/** Written out rather than derived, so a renamed anchor is a compile error here. */
const TARGETS: Record<DashboardTourStepId, string> = {
    header: anchor('dashboard-header'),
    tiles: anchor('dashboard-metric-tiles'),
    executions: anchor('dashboard-executions-card'),
    resources: anchor('dashboard-resource-usage-card'),
    connectors: anchor('dashboard-top-workflows-card'),
    comingSoon: anchor('dashboard-coming-soon'),
    createWorkflow: anchor('topbar-create-workflow'),
    // The palette owns this one, and the intro tour spotlights it too.
    palette: PALETTE_TOUR_TARGET,
    language: anchor('topbar-language'),
    // The trigger, not the menu entry: the entries only exist while it is open.
    help: anchor('topbar-help'),
    menuSwitch: anchor('topbar-menu-switch'),
    profile: anchor('topbar-profile'),
}

export const targetFor = (id: DashboardTourStepId) => TARGETS[id]
