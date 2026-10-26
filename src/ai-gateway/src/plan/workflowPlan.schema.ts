import { z } from 'zod'

export const PLAN_PATTERNS = ['sync', 'custom'] as const

export const planStepSchema = z.object({
    /** One plain-language step that names the operation it uses. */
    text: z.string().min(1),
    /** Nesting: a step one level deeper than the step above it runs inside that loop or condition. */
    depth: z.number().int().min(0).max(4),
})

export const workflowPlanSchema = z.object({
    pattern: z.enum(PLAN_PATTERNS),
    steps: z.array(planStepSchema).min(1).max(24),
})

export type PlanPattern = (typeof PLAN_PATTERNS)[number]
export type PlanStep = z.infer<typeof planStepSchema>
export type WorkflowPlan = z.infer<typeof workflowPlanSchema>
