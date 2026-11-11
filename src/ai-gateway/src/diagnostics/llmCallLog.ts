/** How one model call went; the times are milliseconds. */
export type LlmCallStats = {
    at: string
    route: string | null
    model: string
    outcome: 'done' | 'aborted' | 'timeout' | 'error'
    /** Other calls already running in the gateway when this one started. */
    inFlightBefore: number
    /** Whether Ollama had the model in memory when the call started; false = it was loaded (again) for this call. */
    wasLoaded: boolean | null
    wallMs: number
    /** Until the first piece of the answer arrived. */
    firstTokenMs: number | null
    /** Before the first piece and not spent reading the prompt: waiting for Ollama, and loading the model. */
    waitMs: number | null
    /** Ollama's own load time; it also counts time spent waiting for the model to be free. */
    loadMs: number | null
    promptTokens: number | null
    promptMs: number | null
    outputTokens: number | null
    outputMs: number | null
}

export type LlmCallStart = { route: string | null; model: string; wasLoaded: boolean | null }

export type LlmCallLog = {
    /** Counts the call as running; the returned function records how it ended. */
    begin(start: LlmCallStart): (end: Omit<LlmCallStats, 'at' | keyof LlmCallStart | 'inFlightBefore'>) => void
    inFlight(): number
    recent(): LlmCallStats[]
}

const CAPACITY = 500

/** The last calls in memory, newest last, each also handed to `onRecord` (the gateway's log). */
export function createLlmCallLog(onRecord: (stats: LlmCallStats) => void = () => {}): LlmCallLog {
    let running = 0
    const calls: LlmCallStats[] = []
    return {
        begin(start) {
            const inFlightBefore = running
            const at = new Date().toISOString()
            running += 1
            let isEnded = false
            return (end) => {
                if (isEnded) return
                isEnded = true
                running -= 1
                const stats: LlmCallStats = { at, ...start, inFlightBefore, ...end }
                calls.push(stats)
                if (calls.length > CAPACITY) calls.shift()
                onRecord(stats)
            }
        },
        inFlight: () => running,
        recent: () => [...calls],
    }
}
