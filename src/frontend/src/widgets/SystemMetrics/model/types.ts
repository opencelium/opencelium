export type Metrics = {
    cpu?: number
    memory?: number
    disk?: number
    network?: number
    timestamp?: number
    executions?: number
    failureRate?: number
    avgRuntimeMs?: number
    runningJobs?: number
    apiUsageBytes?: number
    executionsDelta?: number
    failureRateDelta?: number
    avgRuntimeDelta?: number
    runningJobsDelta?: number
    apiUsageDelta?: number
} & Record<string, unknown>
