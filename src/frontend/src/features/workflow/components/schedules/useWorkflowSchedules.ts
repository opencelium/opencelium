import { useMemo } from 'react'
import { useFetchEntitiesQuery } from '@shared/api/genericApi'
import { useCurrentSchedules } from '@entities/schedule/socket/useCurrentSchedules'
import type { Schedule, ScheduleExecutionRun } from '@entities/schedule/model/types'

export type ScheduleAggregateStatus = 'running' | 'error' | 'ok' | 'idle'

export type WorkflowScheduleItem = {
    schedule: Schedule
    isRunning: boolean
    status: ScheduleAggregateStatus
    avgDuration?: number
    recentlyUpdated: boolean
}

const SCHEDULE_LIST_URL = '/scheduler/all'

function endTime(run?: ScheduleExecutionRun): number {
    if (!run?.startTime) return 0
    return run.startTime + (run.duration ?? 0)
}

// Mirrors StatusCell.resolveRing: the more recent of last-success / last-fail wins.
function lastResult(schedule: Schedule): 'success' | 'exception' | null {
    const successEnd = endTime(schedule.lastExecution?.success)
    const failEnd = endTime(schedule.lastExecution?.fail)
    if (successEnd === 0 && failEnd === 0) return null
    return successEnd >= failEnd ? 'success' : 'exception'
}

function scheduleStatus(schedule: Schedule, isRunning: boolean): ScheduleAggregateStatus {
    if (isRunning) return 'running'
    const result = lastResult(schedule)
    if (result === 'exception') return 'error'
    if (result === 'success') return 'ok'
    return 'idle'
}

function computeAggregate(items: WorkflowScheduleItem[]): ScheduleAggregateStatus {
    if (items.length === 0) return 'idle'
    if (items.some((item) => item.status === 'running')) return 'running'
    if (items.some((item) => item.status === 'error')) return 'error'
    if (items.some((item) => item.status === 'ok')) return 'ok'
    return 'idle'
}

/**
 * Schedules attached to a single connection, merged with live run state.
 * Reads the same `/scheduler/all` cache the entity list and the running-execution
 * socket patch in place, so create/update/delete and live runs reflect without a
 * dedicated endpoint (the backend has no connection-scoped scheduler route).
 */
export function useWorkflowSchedules(connectionId?: string) {
    const numericId = Number(connectionId)
    const hasConnection = Boolean(connectionId) && Number.isFinite(numericId)
    const { data, isLoading, isFetching } = useFetchEntitiesQuery(SCHEDULE_LIST_URL, {
        skip: !hasConnection,
    })
    const { getRunningExecutions, wasRecentlyUpdated } = useCurrentSchedules()

    const schedules = useMemo<Schedule[]>(() => {
        if (!Array.isArray(data) || !hasConnection) return []
        return (data as Schedule[]).filter(
            (schedule) => schedule.connection?.connectionId === numericId,
        )
    }, [data, hasConnection, numericId])

    const items = useMemo<WorkflowScheduleItem[]>(
        () =>
            schedules.map((schedule) => {
                const running = getRunningExecutions(schedule.schedulerId)
                const isRunning = running.length > 0
                return {
                    schedule,
                    isRunning,
                    status: scheduleStatus(schedule, isRunning),
                    avgDuration: running[0]?.avgDuration ?? schedule.lastExecution?.success?.duration,
                    recentlyUpdated: wasRecentlyUpdated(schedule.schedulerId),
                }
            }),
        [schedules, getRunningExecutions, wasRecentlyUpdated],
    )

    const aggregate = useMemo(() => computeAggregate(items), [items])

    return { items, isLoading, isFetching, aggregate, count: items.length }
}
