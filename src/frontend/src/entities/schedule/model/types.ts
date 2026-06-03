
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

export type CurrentSchedule = {
    avgDuration: number,
    schedulerId: number
    title: string
}
