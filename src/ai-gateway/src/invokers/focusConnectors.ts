import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { ConnectorSide } from '../dsl/workflowDsl.schema.ts'
import { cosine } from '../examples/cosine.ts'
import type { Embedder } from '../llm/ollamaEmbedder.ts'
import { describeOperation } from '../workflow/buildWorkflowPrompt.ts'
import type { Invoker, InvokerOperation } from './invoker.types.ts'

/** Rough token count of prompt text: qwen-family tokenizers average about 3.3 characters per token on these prompts. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 3.3)

/** `<side>:<operation>`, so the same operation name on both systems stays two entries. */
export const operationKey = (side: ConnectorSide, operation: string) => `${side}:${operation}`

/** The connectors with only the listed operations: what the model is told about, may call, and is validated against. */
export function restrictConnectors(connectors: WorkflowConnectors, keep: ReadonlySet<string>): WorkflowConnectors {
    const restrict = (side: ConnectorSide, invoker: Invoker): Invoker =>
        ({ ...invoker, operations: invoker.operations.filter((operation) => keep.has(operationKey(side, operation.name))) })
    return { from: restrict('from', connectors.from), to: connectors.to && restrict('to', connectors.to) }
}

export type OperationRanker = {
    /** Similarity of each operation of `invoker` to `text`, by operation name; empty when ranking is unavailable. */
    rank(invoker: Invoker, text: string): Promise<Map<string, number>>
}

const describeForRanking = (operation: InvokerOperation) => `${operation.name}: ${operation.httpMethod} ${operation.endpoint}`

/** Embeds each invoker's operations once and keeps them; a failure ranks nothing rather than failing the request. */
export function createOperationRanker(embedder: Embedder): OperationRanker {
    const vectors = new Map<string, Promise<number[][]>>()
    return {
        async rank(invoker, text) {
            try {
                let own = vectors.get(invoker.name)
                if (!own) {
                    own = embedder.embed(invoker.operations.map(describeForRanking))
                    vectors.set(invoker.name, own)
                    own.catch(() => vectors.delete(invoker.name))
                }
                const [all, [query = []]] = await Promise.all([own, embedder.embed([text])])
                return new Map(invoker.operations.map((operation, index) => [operation.name, cosine(query, all[index] ?? [])]))
            } catch {
                return new Map()
            }
        },
    }
}

const wordsOf = (text: string) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2))

/** Without embeddings: the share of an operation's name and endpoint words that the request uses. */
function overlap(operation: InvokerOperation, words: Set<string>): number {
    const own = wordsOf(`${operation.name.replace(/([a-z])([A-Z])/g, '$1 $2')} ${operation.endpoint}`)
    return own.size ? [...own].filter((word) => words.has(word)).length / own.size : 0
}

export type FocusRequest = {
    /** The request (and plan) the operations are ranked against. */
    text: string
    /** Operation keys that must stay: named in the plan or called by a template shown as an example. */
    required: ReadonlySet<string>
    budgetTokens: number
}

export type FocusResult = { connectors: WorkflowConnectors; omittedCount: number; describedTokens: number }

/**
 * Large invokers (Netbox: 864 operations, ~150k tokens) do not fit the model's context, and Ollama silently cuts an
 * overlong prompt. When both connectors' descriptions exceed the budget, the operations the request needs most are
 * kept: required ones first, then the closest in meaning, until the budget is spent. Small pairs pass unchanged.
 */
export async function focusConnectors(connectors: WorkflowConnectors, request: FocusRequest, ranker?: OperationRanker): Promise<FocusResult> {
    const sides: [ConnectorSide, Invoker][] = [['from', connectors.from]]
    if (connectors.to) sides.push(['to', connectors.to])
    const candidates = sides.flatMap(([side, invoker]) => invoker.operations.map((operation) => ({
        side, invoker, operation, key: operationKey(side, operation.name),
        tokens: estimateTokens(describeOperation(operation, invoker.requiredData)),
    })))
    const total = candidates.reduce((sum, candidate) => sum + candidate.tokens, 0)
    if (total <= request.budgetTokens) return { connectors, omittedCount: 0, describedTokens: total }

    const words = wordsOf(request.text)
    const similarity = new Map<string, number>()
    for (const [side, invoker] of sides) {
        const ranked = ranker ? await ranker.rank(invoker, request.text) : new Map<string, number>()
        for (const operation of invoker.operations) {
            similarity.set(operationKey(side, operation.name), ranked.get(operation.name) ?? overlap(operation, words))
        }
    }
    const ordered = [...candidates].sort((left, right) =>
        Number(request.required.has(right.key)) - Number(request.required.has(left.key))
        || (similarity.get(right.key) ?? 0) - (similarity.get(left.key) ?? 0))
    const keep = new Set<string>()
    let used = 0
    for (const candidate of ordered) {
        const isRequired = request.required.has(candidate.key)
        if (!isRequired && used + candidate.tokens > request.budgetTokens) continue
        keep.add(candidate.key)
        used += candidate.tokens
    }
    return { connectors: restrictConnectors(connectors, keep), omittedCount: candidates.length - keep.size, describedTokens: used }
}
