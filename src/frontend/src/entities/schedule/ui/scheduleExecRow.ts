import type {Schedule} from '../model/types'
import type {RunningExecution} from '../socket/CurrentSchedulesContext'

// A synthetic list row representing one in-flight execution, rendered as an
// expandable sub-row beneath its parent schedule. Carries the parent's connection
// so the connection column still resolves for search, and a unique __rowId.
export type ScheduleExecRow = {
    __execRow: true
    __rowId: string
    schedulerId: number
    connection: Schedule['connection']
    execution: RunningExecution
}

export function isScheduleExecRow(row: unknown): row is ScheduleExecRow {
    return typeof row === 'object' && row !== null && '__execRow' in row
}

export function buildExecRow(schedule: Schedule, execution: RunningExecution): ScheduleExecRow {
    return {
        __execRow: true,
        __rowId: `schedule-exec-${execution.execId}`,
        schedulerId: schedule.schedulerId,
        connection: schedule.connection,
        execution,
    }
}
