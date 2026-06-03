import {type ReactNode, useCallback, useMemo, useRef, useState} from "react"
import type {CurrentSchedule, Schedule} from "@entities/schedule/model/types"
import {useSocket} from "@shared/api/socket/useSocket"
import {useStompSubscription} from "@shared/api/socket/useStompSubscription"
import {store} from "@app/store/store"
import {genericApi} from "@shared/api/genericApi"
import {scheduleApi} from "@entities/schedule/api/scheduleApi"
import {
    CurrentSchedulesContext,
    type CurrentSchedulesContextValue,
    type ScheduleRunStatus,
} from "./CurrentSchedulesContext"

const FINISH_FLASH_MS = 5000
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

type RunningEntry = {
    localStartTime: number
    avgDuration: number
}

type FinishedEntry = {
    finishedAt: number
    lastProgressPercent: number
}

type Props = {children: ReactNode}

export function CurrentSchedulesProvider({children}: Props) {
    const {client, status} = useSocket()
    const [currentSchedules, setCurrentSchedules] = useState<CurrentSchedule[]>([])
    const [runningMap, setRunningMap] = useState<Map<number, RunningEntry>>(new Map())
    const [finishedMap, setFinishedMap] = useState<Map<number, FinishedEntry>>(new Map())
    const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set())
    const previousRunningRef = useRef<Map<number, RunningEntry>>(new Map())

    const handleMessage = useCallback((schedules: CurrentSchedule[]) => {
        const now = Date.now()
        const prev = previousRunningRef.current
        const incomingIds = new Set(schedules.map((s) => s.schedulerId))

        const nextRunning = new Map<number, RunningEntry>()
        for (const s of schedules) {
            const existing = prev.get(s.schedulerId)
            nextRunning.set(s.schedulerId, {
                localStartTime: existing?.localStartTime ?? now,
                avgDuration: s.avgDuration,
            })
        }

        const disappeared: Array<{id: number; pct: number}> = []
        for (const [id, entry] of prev) {
            if (!incomingIds.has(id)) {
                const elapsed = now - entry.localStartTime
                const pct = entry.avgDuration > 0
                    ? Math.min(95, Math.max(0, (elapsed / entry.avgDuration) * 100))
                    : 0
                disappeared.push({id, pct})
            }
        }

        previousRunningRef.current = nextRunning
        setCurrentSchedules(schedules)
        setRunningMap(nextRunning)

        if (disappeared.length === 0) return

        setFinishedMap((fm) => {
            const next = new Map(fm)
            for (const {id, pct} of disappeared) {
                next.set(id, {finishedAt: now, lastProgressPercent: pct})
            }
            return next
        })

        refreshFinishedSchedules(disappeared.map((d) => d.id)).then((updatedIds) => {
            if (updatedIds.length === 0) return
            setHighlightedIds((prev) => {
                const next = new Set(prev)
                for (const id of updatedIds) next.add(id)
                return next
            })
            setTimeout(() => {
                setHighlightedIds((prev) => {
                    if (updatedIds.every((id) => !prev.has(id))) return prev
                    const next = new Set(prev)
                    for (const id of updatedIds) next.delete(id)
                    return next
                })
            }, HIGHLIGHT_MS)
        })

        for (const {id} of disappeared) {
            setTimeout(() => {
                setFinishedMap((fm) => {
                    if (!fm.has(id)) return fm
                    const next = new Map(fm)
                    next.delete(id)
                    return next
                })
            }, FINISH_FLASH_MS)
        }
    }, [])

    useStompSubscription<CurrentSchedule[]>(
        client,
        status === 'connected',
        '/scheduler/running/all',
        handleMessage,
    )

    const getRunStatus = useCallback(
        (schedulerId: number): ScheduleRunStatus => {
            const running = runningMap.get(schedulerId)
            if (running) {
                return {
                    kind: 'running',
                    localStartTime: running.localStartTime,
                    avgDuration: running.avgDuration,
                }
            }
            const finished = finishedMap.get(schedulerId)
            if (finished) {
                return {
                    kind: 'just-finished',
                    finishedAt: finished.finishedAt,
                    lastProgressPercent: finished.lastProgressPercent,
                }
            }
            return {kind: 'idle'}
        },
        [runningMap, finishedMap],
    )

    const wasRecentlyUpdated = useCallback(
        (schedulerId: number): boolean => highlightedIds.has(schedulerId),
        [highlightedIds],
    )

    const value = useMemo<CurrentSchedulesContextValue>(
        () => ({currentSchedules, getRunStatus, wasRecentlyUpdated}),
        [currentSchedules, getRunStatus, wasRecentlyUpdated],
    )

    return (
        <CurrentSchedulesContext.Provider value={value}>
            {children}
        </CurrentSchedulesContext.Provider>
    )
}
