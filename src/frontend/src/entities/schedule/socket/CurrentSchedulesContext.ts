import {createContext} from "react"

// A single running execution as tracked by the provider. `localStartTime` is when
// *we* first saw this execId (drives the progress ring, immune to clock skew /
// replays); `serverStartTime` is the backend start instant in ms (shown to the user).
export type RunningExecution = {
    execId: number
    schedulerId: number
    localStartTime: number
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
