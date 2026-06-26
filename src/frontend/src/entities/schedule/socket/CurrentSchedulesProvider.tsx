import {type ReactNode, useCallback, useMemo, useRef, useState} from "react"
import type {CurrentExecution, Schedule} from "@entities/schedule/model/types"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {store} from "@app/store/store"
import {genericApi} from "@shared/api/genericApi"
import {scheduleApi} from "@entities/schedule/api/scheduleApi"
import {
    CurrentSchedulesContext,
    type CurrentSchedulesContextValue,
    type RunningExecution,
} from "./CurrentSchedulesContext"

const HIGHLIGHT_MS = 1800
const SCHEDULE_LIST_URL = '/scheduler/all'

async function refreshFinishedSchedules(ids: number[]): Promise<number[]> {
    if (ids.length === 0) return []
    try {
        const updated = await store
            .dispatch(scheduleApi.endpoints.getSchedulesByIds.initiate(ids))
            .unwrap()
        if (!Array.isArray(updated) || updated.length === 0) return []
        store.dispatch(
            genericApi.util.updateQueryData('fetchEntities', SCHEDULE_LIST_URL, (draft) => {
                if (!Array.isArray(draft)) return
                for (const next of updated) {
                    const idx = draft.findIndex(
                        (row: Schedule) => row.schedulerId === next.schedulerId,
                    )
                    if (idx >= 0) draft[idx] = next
                }
            }),
        )
        return updated.map((s) => s.schedulerId)
    } catch {
        return []
    }
}

type Props = {children: ReactNode}

export function CurrentSchedulesProvider({children}: Props) {
    const {client, status} = useSocket()
    // Running executions keyed by execId — the same schedulerId may have several.
    const [runningMap, setRunningMap] = useState<Map<number, RunningExecution>>(new Map())
    const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set())
    const previousRunningRef = useRef<Map<number, RunningExecution>>(new Map())

    const handleMessage = useCallback((executions: CurrentExecution[]) => {
        console.log(executions)
        const now = Date.now()
        const prev = previousRunningRef.current
        const incomingIds = new Set(executions.map((e) => e.execId))

        const nextRunning = new Map<number, RunningExecution>()
        for (const e of executions) {
            const existing = prev.get(e.execId)
            const parsed = Date.parse(e.startTime)
            nextRunning.set(e.execId, {
                execId: e.execId,
                schedulerId: e.schedulerId,
                // Preserve our first-seen instant so the ring doesn't reset on heartbeats.
                localStartTime: existing?.localStartTime ?? now,
                serverStartTime: Number.isNaN(parsed) ? now : parsed,
                avgDuration: e.avgDuration,
            })
        }

        // An execId present last time but gone now means that execution finished.
        const finishedSchedulerIds = new Set<number>()
        for (const [execId, entry] of prev) {
            if (!incomingIds.has(execId)) finishedSchedulerIds.add(entry.schedulerId)
        }

        previousRunningRef.current = nextRunning
        setRunningMap(nextRunning)

        if (finishedSchedulerIds.size === 0) return

        // Refetch the affected schedules so their last-execution columns update, then
        // flash the row. Patches the list cache in place (see scheduleApi note).
        refreshFinishedSchedules([...finishedSchedulerIds]).then((updatedIds) => {
            if (updatedIds.length === 0) return
            setHighlightedIds((prevIds) => {
                const next = new Set(prevIds)
                for (const id of updatedIds) next.add(id)
                return next
            })
            setTimeout(() => {
                setHighlightedIds((prevIds) => {
                    if (updatedIds.every((id) => !prevIds.has(id))) return prevIds
                    const next = new Set(prevIds)
                    for (const id of updatedIds) next.delete(id)
                    return next
                })
            }, HIGHLIGHT_MS)
        })
    }, [])

    useStompSubscription<CurrentExecution[]>(
        client,
        status === 'connected',
        '/scheduler/running/all',
        handleMessage,
    )

    const getRunningExecutions = useCallback(
        (schedulerId: number): RunningExecution[] => {
            const list: RunningExecution[] = []
            for (const entry of runningMap.values()) {
                if (entry.schedulerId === schedulerId) list.push(entry)
            }
            return list.sort((a, b) => a.serverStartTime - b.serverStartTime)
        },
        [runningMap],
    )

    const wasRecentlyUpdated = useCallback(
        (schedulerId: number): boolean => highlightedIds.has(schedulerId),
        [highlightedIds],
    )

    const value = useMemo<CurrentSchedulesContextValue>(
        () => ({getRunningExecutions, wasRecentlyUpdated}),
        [getRunningExecutions, wasRecentlyUpdated],
    )

    return (
        <CurrentSchedulesContext.Provider value={value}>
            {children}
        </CurrentSchedulesContext.Provider>
    )
}
