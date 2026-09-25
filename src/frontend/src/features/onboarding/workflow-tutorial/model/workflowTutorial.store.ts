import { create } from 'zustand'
import { setSimulatedTestRun } from '@features/workflow/test-run/simulatedTestRun'
import { setSimulatedSchedulesConnection } from '@features/workflow/components/schedules/simulatedSchedulesConnection'
import { setSimulatedHistoryVersions } from '@features/workflow/components/header/HistoryPanel/simulatedHistoryVersions'
import { setSimulatedWorkflowGraph } from '@features/workflow/hooks/simulatedWorkflowGraph'
import { clearTutorialData, seedTutorialData } from './tutorialData'
import { createTutorialTestRun } from './tutorialTestRun'
import { TUTORIAL_CONNECTION_ID } from './tutorialSchedules'
import { buildTutorialVersions } from './tutorialVersions'
import { buildTutorialGraph } from './tutorialGraph'
import { resetCanvasProgress } from './useCanvasProgress'

type WorkflowTutorialState = {
    /** True once the user asks for the tutorial; the tour itself checks the route. */
    requested: boolean
    /**
     * `floor` is the step a `?tutorialStep=` URL opens on: the canvas is then given
     * the graph the steps before it would have built.
     */
    request: (floor?: number) => void
    dismiss: () => void
}

/**
 * Deliberately not persisted, unlike the onboarding store: this is a "show me now"
 * request, not progress worth restoring. A reload drops it, which is the behaviour
 * you want from a sandbox that also disables saving.
 */
export const useWorkflowTutorialStore = create<WorkflowTutorialState>(set => ({
    requested: false,
    // Seeds here rather than in the tour's effects: the fixtures have to be in the
    // cache before the editor mounts and fetches for real. See tutorialData.
    // Both ends clear the latched progress. Doing it only on the way out was not
    // enough: leaving the editor without dismissing kept "the loop was configured"
    // set, so a second run opened with steps already satisfied and skipped past them.
    request: (floor) => {
        seedTutorialData()
        // Registered alongside the fixtures, and for the same reason: the editor's
        // test run must answer from the invented systems too, or the last steps
        // would point at a debugger that only ever renders for a real execution.
        setSimulatedTestRun(createTutorialTestRun)
        // And for the same reason again: the schedules pill renders only for a saved
        // connection, so without a stand-in the last steps would point at a header
        // that has no schedules control on it at all.
        setSimulatedSchedulesConnection(String(TUTORIAL_CONNECTION_ID))
        // Nothing in the tutorial is ever saved, so without samples the version
        // history step would open on an empty panel with nothing to describe.
        setSimulatedHistoryVersions(buildTutorialVersions)
        setSimulatedWorkflowGraph(floor ? buildTutorialGraph(floor) : null)
        resetCanvasProgress()
        set({ requested: true })
    },
    dismiss: () => {
        clearTutorialData()
        setSimulatedTestRun(null)
        setSimulatedSchedulesConnection(null)
        setSimulatedHistoryVersions(null)
        setSimulatedWorkflowGraph(null)
        resetCanvasProgress()
        set({ requested: false })
    },
}))
