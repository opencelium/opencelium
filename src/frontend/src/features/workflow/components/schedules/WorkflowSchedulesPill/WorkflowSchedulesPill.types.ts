import type { RunPolicyNotice } from '../../run-policy/useWorkflowRunPolicyNotice'

export type WorkflowSchedulesPillProps = {
    connectionId?: string
    open: boolean
    onToggle: () => void
    runPolicy?: RunPolicyNotice | null
}
