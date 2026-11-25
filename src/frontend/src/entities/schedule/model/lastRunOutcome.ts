import type {Schedule, ScheduleExecutionRun} from './types'

export type LastRunOutcome = 'success' | 'failure'

const endTime = (run?: ScheduleExecutionRun) => (run?.startTime ? run.startTime + (run.duration ?? 0) : 0)

/** The more recent of last-success / last-failure wins; `null` when the schedule never ran. */
export function lastRunOutcome(schedule: Schedule): LastRunOutcome | null {
    const successEnd = endTime(schedule.lastExecution?.success)
    const failEnd = endTime(schedule.lastExecution?.fail)
    if (successEnd === 0 && failEnd === 0) return null
    return successEnd >= failEnd ? 'success' : 'failure'
}
