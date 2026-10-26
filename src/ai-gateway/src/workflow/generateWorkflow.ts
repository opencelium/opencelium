import { type WorkflowConnectors, buildConstrainedSchema, toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { type WorkflowIssue, hasErrors, validateWorkflow } from '../dsl/validateWorkflow.ts'
import type { WorkflowDsl } from '../dsl/workflowDsl.schema.ts'
import type { ChatMessage, LlmClient } from '../llm/llmClient.ts'
import { buildRepairMessage, buildWorkflowSystemPrompt } from './buildWorkflowPrompt.ts'

export type GenerateWorkflowDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
    maxRepairAttempts: number
}

export type GenerationAttempt = {
    promptTokens: number
    outputTokens: number
    durationMs: number
    errorCount: number
}

export type GenerateWorkflowResult = {
    dsl: WorkflowDsl
    issues: WorkflowIssue[]
    attempts: GenerationAttempt[]
    model: string
}

type Candidate = { dsl: WorkflowDsl; issues: WorkflowIssue[] }

// The first answer is deterministic; repairs need some randomness or the model repeats its first answer verbatim.
const FIRST_TEMPERATURE = 0
const REPAIR_TEMPERATURE = 0.4

function errorCount(issues: WorkflowIssue[]): number {
    return issues.filter((issue) => issue.severity === 'error').length
}

/**
 * Generates a workflow under a per-request JSON-schema constraint, then validates what the schema cannot express
 * (step order, loop scope, response paths) and asks the model to repair errors up to `maxRepairAttempts` times.
 * Returns the attempt with the fewest errors; its remaining issues travel with it.
 */
export async function generateWorkflow(
    prompt: string,
    connectors: WorkflowConnectors,
    deps: GenerateWorkflowDeps,
): Promise<GenerateWorkflowResult> {
    const schema = buildConstrainedSchema(connectors)
    const format = toJsonSchema(schema)
    const messages: ChatMessage[] = [
        { role: 'system', content: buildWorkflowSystemPrompt(connectors) },
        { role: 'user', content: prompt },
    ]
    const attempts: GenerationAttempt[] = []
    let best: Candidate | undefined

    for (let attempt = 0; attempt <= deps.maxRepairAttempts; attempt++) {
        const result = await deps.llm.chat({
            model: deps.model,
            messages,
            format,
            contextTokens: deps.contextTokens,
            temperature: attempt === 0 ? FIRST_TEMPERATURE : REPAIR_TEMPERATURE,
        })
        const outcome = parseAndValidate(result.content, schema, connectors)
        attempts.push({
            promptTokens: result.promptTokens,
            outputTokens: result.outputTokens,
            durationMs: result.durationMs,
            errorCount: errorCount(outcome.issues),
        })
        if (outcome.dsl && (!best || errorCount(outcome.issues) < errorCount(best.issues))) {
            best = { dsl: outcome.dsl, issues: outcome.issues }
        }
        if (!hasErrors(outcome.issues)) break
        messages.push(
            { role: 'assistant', content: result.content },
            { role: 'user', content: buildRepairMessage(outcome.issues) },
        )
    }

    if (!best) throw new Error('The model did not return a parseable workflow')
    return { dsl: best.dsl, issues: best.issues, attempts, model: deps.model }
}

function parseAndValidate(
    content: string,
    schema: ReturnType<typeof buildConstrainedSchema>,
    connectors: WorkflowConnectors,
): { dsl?: WorkflowDsl; issues: WorkflowIssue[] } {
    let json: unknown
    try {
        json = JSON.parse(content)
    } catch {
        return { issues: [{ stepId: '', severity: 'error', message: 'The answer was not valid JSON' }] }
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
        const message = parsed.error.issues
            .slice(0, 5)
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ')
        return { issues: [{ stepId: '', severity: 'error', message: `The answer does not match the schema: ${message}` }] }
    }
    return { dsl: parsed.data, issues: validateWorkflow(parsed.data, connectors) }
}
