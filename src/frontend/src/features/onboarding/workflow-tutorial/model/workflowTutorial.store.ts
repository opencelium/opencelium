import { create } from 'zustand'
import { clearTutorialData, seedTutorialData } from './tutorialData'
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
        resetCanvasProgress()
        set({ requested: true })
    },
    dismiss: () => {
        clearTutorialData()
        resetCanvasProgress()
        set({ requested: false })
    },
}))
