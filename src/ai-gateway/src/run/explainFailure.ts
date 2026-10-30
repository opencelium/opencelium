import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { InvokerRepository } from '../invokers/invokerRepository.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { type RunFailure, describeFailure, loadFailureContext, referencesNamedInError } from './runFailure.ts'

const answerSchema = z.object({
    /** One sentence a non-developer understands. */
    summary: z.string().min(1),
    cause: z.string().min(1),
    /** Concrete changes, in the order to try them. */
    fix: z.array(z.string().min(1)).max(5),
    /** True when changing this call's headers or body is likely enough; the UI offers "Fix with AI" only then. */
    isRequestFixable: z.boolean(),
})

export type FailureExplanation = z.infer<typeof answerSchema> & { durationMs: number; model: string }

export type RunAiDeps = { llm: LlmClient; model: string; contextTokens: number; invokers: InvokerRepository }

const SYSTEM_PROMPT = `You help people fix OpenCelium integration workflows. A test run failed; explain why in plain
language for someone who is not a developer. Use the error, the request that was sent and the response that came back.
Name the exact field, value or setting at fault when the data shows it; say so when the data does not show the cause
instead of guessing. Typical causes: a required field missing or empty, a value the target system does not accept,
a reference to an earlier step that reads the wrong path (empty value), wrong id in the URL, credentials or
permissions (fix in the connector, not the workflow), the target system being unreachable.
"fix" lists concrete changes in the workflow or connector. Set "isRequestFixable" to true only when changing this
call's request headers or request body is likely to make it succeed; a reference in the body or headers that cannot be
resolved or reads the wrong path is such a change. Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

export async function explainFailure(failure: RunFailure, deps: RunAiDeps): Promise<FailureExplanation> {
    const context = await loadFailureContext(failure, deps.invokers)
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: describeFailure(failure, context) }],
        format: answerFormat,
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable explanation')
    }
    const parsed = answerSchema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable explanation')
    const isRequestFixable = (parsed.data.isRequestFixable || referencesNamedInError(failure).length > 0) && failure.failure.kind === 'method' && Boolean(failure.step)
    return { ...parsed.data, isRequestFixable, durationMs: result.durationMs, model: deps.model }
}
