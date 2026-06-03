import { memo } from 'react'
import type { ScheduleExecutionRun } from '../model/types'
import { formatExecutionDate } from './formatExecutionDate'

type Props = {
    execution?: ScheduleExecutionRun
}

export const ExecutionCell = memo(function ExecutionCell({ execution }: Props) {
    if (!execution || !execution.startTime) return <>-</>
    const executionId = execution.taId?.split('-')[1] ?? ''
    return (
        <span>
            {formatExecutionDate(execution.startTime)}
            {executionId ? ` [${executionId}]` : ''}
        </span>
    )
})
