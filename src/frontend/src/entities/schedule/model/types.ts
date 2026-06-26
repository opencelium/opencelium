
export type ScheduleExecutionRun = {
    startTime: number
    taId: string
    duration?: number
    hasLog?: boolean
}

export type ScheduleLastExecution = {
    success?: ScheduleExecutionRun
    fail?: ScheduleExecutionRun
}

export type ScheduleWebhook = {
    url: string
    webhookId: number
}

export type Schedule = {
    schedulerId: number
    title: string
    connection: {
        connectionId: number,
        title: string,
    }
    cronExp: string
    debugMode: boolean
    status: boolean | 0 | 1
    lastExecution?: ScheduleLastExecution
    webhook?: ScheduleWebhook
}

export type ScheduleAddDTO = Omit<Schedule, "connection" | "schedulerId" | "lastExecution" | "webhook"> & {
    connectionId: string
}

export type ScheduleUpdateDTO = Omit<Schedule, "connection" | "lastExecution" | "webhook"> & {
    connectionId: string
}

// One in-flight execution as broadcast on /scheduler/running/all. The same
// schedulerId/connectionId can appear multiple times concurrently — each run is
// uniquely identified by execId. startTime is an ISO-8601 string from the server.
export type CurrentExecution = {
    connectionId: number
    schedulerId: number
    execId: number
    title: string
    startTime: string
    avgDuration: number
    fromConnector: unknown
    toConnector: unknown
}
