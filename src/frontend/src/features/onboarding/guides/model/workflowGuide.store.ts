import { create } from 'zustand'
import type { WorkflowGuideId } from './workflowGuides'

export type GuidePart = 'body' | 'header'

export type ActiveWorkflowGuide =
    | { guideId: Exclude<WorkflowGuideId, 'method-transformation'>; nodeId: string; methodLabel: string }
    | {
        guideId: 'method-transformation'
        nodeId: string
        methodLabel: string
        part: GuidePart
        /** The key of a field holding a reference, to transform; null when the method has none to show. */
        field: string | null
    }

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
