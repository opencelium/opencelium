import { type WorkflowConnectors, buildConstrainedSchema, toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { normalizeWorkflow } from '../dsl/normalizeWorkflow.ts'
import { type WorkflowIssue, hasErrors, validateWorkflow } from '../dsl/validateWorkflow.ts'
import { type WorkflowDsl, workflowDslSchema } from '../dsl/workflowDsl.schema.ts'
import type { z } from 'zod'
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
/** A fixed structure to fill (from a reviewed plan): its own schema and the message describing it. */
export type WorkflowConstraint = { schema: z.ZodType; userMessage: string }

export async function generateWorkflow(
    prompt: string,
    connectors: WorkflowConnectors,
    deps: GenerateWorkflowDeps,
    constraint?: WorkflowConstraint,
): Promise<GenerateWorkflowResult> {
    const schema = constraint?.schema ?? buildConstrainedSchema(connectors)
    const format = toJsonSchema(schema)
    const messages: ChatMessage[] = [
        { role: 'system', content: buildWorkflowSystemPrompt(connectors) },
        { role: 'user', content: constraint?.userMessage ?? prompt },
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
    schema: z.ZodType,
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
    // A constraint schema checks the exact structure; the static schema then types the document as the DSL.
    const typed = workflowDslSchema.safeParse(parsed.data)
    if (!typed.success) return { issues: [{ stepId: '', severity: 'error', message: 'The answer is not a workflow' }] }
    const dsl = normalizeWorkflow(typed.data)
    return { dsl, issues: validateWorkflow(dsl, connectors) }
}
