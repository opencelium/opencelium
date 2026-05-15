import {createContext} from "react"
import type {CurrentSchedule} from "@entities/schedule/model/types"

export type ScheduleRunStatus =
    | { kind: 'idle' }
    | { kind: 'running'; localStartTime: number; avgDuration: number }
    | { kind: 'just-finished'; finishedAt: number; lastProgressPercent: number }

export type CurrentSchedulesContextValue = {
    currentSchedules: CurrentSchedule[]
    getRunStatus: (schedulerId: number) => ScheduleRunStatus
    wasRecentlyUpdated: (schedulerId: number) => boolean
}

export const CurrentSchedulesContext = createContext<CurrentSchedulesContextValue>({
    currentSchedules: [],
    getRunStatus: () => ({kind: 'idle'}),
    wasRecentlyUpdated: () => false,
})
