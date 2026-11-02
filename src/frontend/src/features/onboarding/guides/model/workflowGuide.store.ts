import { create } from 'zustand'
import type { WorkflowGuideId } from './workflowGuides'

export type ActiveWorkflowGuide = { guideId: WorkflowGuideId; nodeId: string; methodLabel: string }

type WorkflowGuideState = {
    active: ActiveWorkflowGuide | null
    start: (guide: ActiveWorkflowGuide) => void
    dismiss: () => void
}

/** Not persisted: a guide answers one question about the workflow on screen right now. */
export const useWorkflowGuideStore = create<WorkflowGuideState>(set => ({
    active: null,
    start: guide => set({ active: guide }),
    dismiss: () => set({ active: null }),
}))
