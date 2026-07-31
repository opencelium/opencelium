import {useCallback} from 'react'
import {useCurrentSchedules} from './useCurrentSchedules'
import {buildExecRow} from '../ui/scheduleExecRow'
import {ScheduleNoExecutions} from '../ui/ScheduleNoExecutions'
import type {Schedule} from '../model/types'

// List sub-rows hook (consumed by GenericEntityList via list.useRowSubRows): every
// schedule is expandable. When executions are running, attach one sub-row each from
// the STOMP feed; when none are, attach a single full-width placeholder that renders
// the empty-state so the toggle still has something to reveal. Memoized on the
// running-execution selector so the row model only rebuilds when executions change.
export function useScheduleSubRows() {
    const {getRunningExecutions} = useCurrentSchedules()
    return useCallback(
        (rows: Record<string, unknown>[]) =>
            rows.map((row) => {
                const schedule = row as unknown as Schedule
                const executions = getRunningExecutions(schedule.schedulerId)
                const subRows =
                    executions.length > 0
                        ? executions.map((execution) => buildExecRow(schedule, execution))
                        : [
                              {
                                  __rowId: `schedule-empty-${schedule.schedulerId}`,
                                  __placeholder: true,
                                  __fullWidth: true,
                                  __fullWidthContent: <ScheduleNoExecutions />,
                                  schedulerId: schedule.schedulerId,
                                  connection: schedule.connection,
                              },
                          ]
                return {...row, __subRows: subRows}
            }),
        [getRunningExecutions],
    )
}
