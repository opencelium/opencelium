import type { FastifyInstance } from 'fastify'
import type { AppDeps } from '../app.ts'
import type { LlmCallStats } from '../diagnostics/llmCallLog.ts'

const percentile = (values: number[], share: number) => {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.min(sorted.length - 1, Math.ceil(share * sorted.length) - 1)]
}

const spread = (values: (number | null)[]) => {
    const known = values.filter((value): value is number => value !== null)
    return { p50: percentile(known, 0.5), p95: percentile(known, 0.95), max: known.length ? Math.max(...known) : null }
}

/** Per model: how long calls waited before their answer started, how often a model had to be loaded, and how calls ended. */
export const summarizeCalls = (calls: LlmCallStats[]) => {
    const byModel = new Map<string, LlmCallStats[]>()
    for (const call of calls) byModel.set(call.model, [...(byModel.get(call.model) ?? []), call])
    return [...byModel].map(([model, list]) => ({
        model,
        calls: list.length,
        concurrent: list.filter((call) => call.inFlightBefore > 0).length,
        coldStarts: list.filter((call) => call.wasLoaded === false).length,
        outcomes: {
            done: list.filter((call) => call.outcome === 'done').length,
            aborted: list.filter((call) => call.outcome === 'aborted').length,
            timeout: list.filter((call) => call.outcome === 'timeout').length,
            error: list.filter((call) => call.outcome === 'error').length,
        },
        waitMs: spread(list.map((call) => call.waitMs)),
        wallMs: spread(list.map((call) => call.wallMs)),
    }))
}

/**
 * What several people using the AI at once does to it: the last calls with their waits, a summary per model, and what
 * Ollama holds in memory now. Read-only, for measuring before the queue and Ollama settings are tuned.
 */
export function registerDiagnosticsRoutes(app: FastifyInstance, { llm, calls }: AppDeps) {
    if (!calls) return
    app.get('/diagnostics/llm', async () => {
        const recent = calls.recent()
        return {
            inFlight: calls.inFlight(),
            loaded: await llm.listRunning?.().catch(() => null) ?? null,
            summary: summarizeCalls(recent),
            recent: recent.slice(-50).reverse(),
        }
    })
}
