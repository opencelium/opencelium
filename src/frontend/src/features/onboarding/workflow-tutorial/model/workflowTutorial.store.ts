import { create } from 'zustand'
import { setSimulatedTestRun } from '@features/workflow/test-run/simulatedTestRun'
import { clearTutorialData, seedTutorialData } from './tutorialData'
import { createTutorialTestRun } from './tutorialTestRun'
import { resetCanvasProgress } from './useCanvasProgress'

type WorkflowTutorialState = {
    /** True once the user asks for the tutorial; the tour itself checks the route. */
    requested: boolean
    request: () => void
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
    request: () => {
        seedTutorialData()
        // Registered alongside the fixtures, and for the same reason: the editor's
        // test run must answer from the invented systems too, or the last steps
        // would point at a debugger that only ever renders for a real execution.
        setSimulatedTestRun(createTutorialTestRun)
        resetCanvasProgress()
        set({ requested: true })
    },
    dismiss: () => {
        clearTutorialData()
        setSimulatedTestRun(null)
        resetCanvasProgress()
        set({ requested: false })
    },
}))
