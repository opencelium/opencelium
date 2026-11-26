import type { BusyPolicy, PickerItem } from './types'

export type RunPolicyVariable = { id: number; name: string; busyPolicy: BusyPolicy }

// A workflow without mutable variables runs in parallel and gets no policy (null).
// `causes` are the variables that decide it: every REFUSE one, or all of them when none refuses.
export type WorkflowRunPolicy = { busyPolicy: BusyPolicy; causes: RunPolicyVariable[] }

// Mirrors the backend's findMutableUsedByWorkflow: the mutable variables the workflow owns
// plus the ones its elements reference.
export function findUsedMutableNames(items: PickerItem[], connectionId: number, referencedNames: string[]): string[] {
    const referenced = new Set(referencedNames.map((name) => name.toLowerCase()))
    return items
        .filter((item) => item.kind === 'MUTABLE'
            && (item.ownerWorkflow?.id === connectionId || referenced.has(item.name.toLowerCase())))
        .map((item) => item.name)
}

// One REFUSE variable is enough to refuse a second start, as on the backend.
export function resolveRunPolicy(variables: RunPolicyVariable[]): WorkflowRunPolicy | null {
    if (variables.length === 0) return null
    const refusing = variables.filter((variable) => variable.busyPolicy === 'REFUSE')
    return refusing.length > 0 ? { busyPolicy: 'REFUSE', causes: refusing } : { busyPolicy: 'QUEUE', causes: variables }
}
