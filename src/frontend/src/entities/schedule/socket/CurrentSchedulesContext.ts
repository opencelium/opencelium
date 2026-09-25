import {createContext} from "react"

// A single running execution as tracked by the provider. `serverStartTime` is the
// backend start instant in ms — used both to show the start time and to drive the
// progress ring, so a page reload/reconnect reflects the execution's true progress
// instead of resetting to 0%.
export type RunningExecution = {
    execId: number
    schedulerId: number
    serverStartTime: number
    avgDuration: number
}

export type CurrentSchedulesContextValue = {
    getRunningExecutions: (schedulerId: number) => RunningExecution[]
    wasRecentlyUpdated: (schedulerId: number) => boolean
}

export const CurrentSchedulesContext = createContext<CurrentSchedulesContextValue>({
    getRunningExecutions: () => [],
    wasRecentlyUpdated: () => false,
})
