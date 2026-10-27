import { z } from 'zod'

export const PLAN_PATTERNS = ['sync', 'custom'] as const

export const planStepSchema = z.object({
    /** One plain-language step that names the operation it uses. */
    text: z.string().min(1),
    /** Nesting: a step one level deeper than the step above it runs inside that loop or condition. */
    depth: z.number().int().min(0).max(4),
})

/** What the model returns: the steps plus, separately, the fields each target operation sets. */
export function buildPlanAnswerSchema(operations: string[]) {
    const [first, ...rest] = operations
    const operation = first === undefined ? z.string() : z.enum([first, ...rest])
    return z.object({
        pattern: z.enum(PLAN_PATTERNS),
        steps: z.array(planStepSchema).min(1).max(24),
        fieldRules: z.array(z.object({
            operations: z.array(operation).min(1),
            field: z.string().min(1),
            /** `item <field>`, `"<text>"` or `script: <what it computes>`. */
            value: z.string().min(1),
        })).max(30),
    })
}

export type PlanPattern = (typeof PLAN_PATTERNS)[number]
export type PlanStep = z.infer<typeof planStepSchema>
export type PlanAnswer = z.infer<ReturnType<typeof buildPlanAnswerSchema>>
/** What the user reviews: field rules are folded into the steps as "<Operation> set <field> = <value>" lines. */
export type WorkflowPlan = { pattern: PlanPattern; steps: PlanStep[] }
