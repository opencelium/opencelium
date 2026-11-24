// Opens the workflow editor on one element. `element` is the element's tree-path index (the
// backend's "Used by" contract); `focusColor` names a method by its colour, as a fallback when the index moved.
export const WORKFLOW_FOCUS_INDEX_PARAM = 'element'
export const WORKFLOW_FOCUS_COLOR_PARAM = 'focusColor'

export type WorkflowFocus = { index?: string; color?: string }

export function buildWorkflowLink(workflowId: number, focus: WorkflowFocus = {}): string {
    const params = new URLSearchParams()
    if (focus.index) params.set(WORKFLOW_FOCUS_INDEX_PARAM, focus.index)
    if (focus.color) params.set(WORKFLOW_FOCUS_COLOR_PARAM, focus.color)
    const search = params.toString()
    return `/workflow/update/${workflowId}${search ? `?${search}` : ''}`
}

export function readWorkflowFocus(search: string): WorkflowFocus | null {
    const params = new URLSearchParams(search)
    const index = params.get(WORKFLOW_FOCUS_INDEX_PARAM) ?? undefined
    const color = params.get(WORKFLOW_FOCUS_COLOR_PARAM) ?? undefined
    return index || color ? { index, color } : null
}

export function withoutWorkflowFocus(search: string): string {
    const params = new URLSearchParams(search)
    params.delete(WORKFLOW_FOCUS_INDEX_PARAM)
    params.delete(WORKFLOW_FOCUS_COLOR_PARAM)
    const rest = params.toString()
    return rest ? `?${rest}` : ''
}
