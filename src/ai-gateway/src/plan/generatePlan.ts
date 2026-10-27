import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { buildPlanSystemPrompt } from './buildPlanPrompt.ts'
import { type PlanAnswer, type PlanStep, type WorkflowPlan, buildPlanAnswerSchema } from './workflowPlan.schema.ts'

export type GeneratePlanDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
}

export type GeneratePlanResult = WorkflowPlan & { durationMs: number; model: string }

/** One line per operation group, in the form the skeleton reads back ("A, B set f = v; g = w"). */
export function fieldRuleSteps(rules: PlanAnswer['fieldRules']): PlanStep[] {
    const groups = new Map<string, string[]>()
    for (const rule of rules) {
        const key = [...new Set(rule.operations)].join(', ')
        groups.set(key, [...(groups.get(key) ?? []), `${rule.field} = ${rule.value.trim().replace(/;/g, ',')}`])
    }
    return [...groups].map(([operations, assignments]) => ({ text: `${operations} set ${assignments.join('; ')}`, depth: 0 }))
}

/** A plain-language plan for the user to review; a schema mismatch cannot happen under constrained decoding, so one call. */
export async function generatePlan(prompt: string, connectors: WorkflowConnectors, deps: GeneratePlanDeps): Promise<GeneratePlanResult> {
    const operations = [connectors.from, connectors.to].flatMap((invoker) => invoker?.operations.map((op) => op.name) ?? [])
    const schema = buildPlanAnswerSchema([...new Set(operations)])
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [
            { role: 'system', content: buildPlanSystemPrompt(connectors) },
            { role: 'user', content: prompt },
        ],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable plan')
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable plan')
    // The first step is the plan's root; a deeper start would leave the indentation meaningless.
    const steps = parsed.data.steps.map((step, index) => (index === 0 ? { ...step, depth: 0 } : step))
    const plan: WorkflowPlan = { pattern: parsed.data.pattern, steps: [...steps, ...fieldRuleSteps(parsed.data.fieldRules)] }
    return { ...plan, durationMs: result.durationMs, model: deps.model }
}
