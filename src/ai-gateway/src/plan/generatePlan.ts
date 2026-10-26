import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { buildPlanSystemPrompt } from './buildPlanPrompt.ts'
import { type WorkflowPlan, workflowPlanSchema } from './workflowPlan.schema.ts'

export type GeneratePlanDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
}

export type GeneratePlanResult = WorkflowPlan & { durationMs: number; model: string }

const planFormat = toJsonSchema(workflowPlanSchema)

/** A plain-language plan for the user to review; a schema mismatch cannot happen under constrained decoding, so one call. */
export async function generatePlan(prompt: string, connectors: WorkflowConnectors, deps: GeneratePlanDeps): Promise<GeneratePlanResult> {
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [
            { role: 'system', content: buildPlanSystemPrompt(connectors) },
            { role: 'user', content: prompt },
        ],
        format: planFormat,
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable plan')
    }
    const parsed = workflowPlanSchema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable plan')
    // The first step is the plan's root; a deeper start would leave the indentation meaningless.
    const steps = parsed.data.steps.map((step, index) => (index === 0 ? { ...step, depth: 0 } : step))
    return { ...parsed.data, steps, durationMs: result.durationMs, model: deps.model }
}
