export type Metrics = {
    disk?: number
    network?: number
    timestamp?: number
    total_execs?: number
    total_failed_execs?: number
    average_runtime_s?: number
    total_runtime?: number
    exec_log_size?: number
    cpu_usage?: number
    memory_usage?: number
    max_memory_size?: number
} & Record<string, unknown>
