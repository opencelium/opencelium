import { z } from 'zod'

export const CONNECTOR_SIDES = ['from', 'to'] as const
export const CONDITION_OPS = ['eq', 'ne', 'gt', 'lt', 'contains', 'exists'] as const

export type ConnectorSide = (typeof CONNECTOR_SIDES)[number]

/**
 * `step` is an earlier method step (path into its response) or an enclosing loop (path inside the current array
 * element). Models write loop elements this way unprompted, so the DSL has a single reference form.
 */
export const stepRefSchema = z.object({ step: z.string(), path: z.string() })

export const valueSchema = z.union([z.object({ literal: z.string() }), z.object({ ref: stepRefSchema })])

export const assignmentSchema = z.object({ name: z.string(), value: valueSchema })

export const conditionSchema = z.object({
    left: valueSchema,
    op: z.enum(CONDITION_OPS),
    right: valueSchema,
})

export const methodStepSchema = z.object({
    id: z.string(),
    kind: z.literal('method'),
    connector: z.enum(CONNECTOR_SIDES),
    operation: z.string(),
    params: z.array(assignmentSchema),
    fields: z.array(assignmentSchema),
})

export type DslValue = z.infer<typeof valueSchema>
export type StepRef = z.infer<typeof stepRefSchema>
export type Assignment = z.infer<typeof assignmentSchema>
export type Condition = z.infer<typeof conditionSchema>
export type MethodStep = z.infer<typeof methodStepSchema>

// Recursive variants are declared by hand: zod cannot infer a type that refers to itself.
export type IfStep = { id: string; kind: 'if'; condition: Condition; then: WorkflowStep[] }
export type LoopStep = { id: string; kind: 'loop'; over: StepRef; body: WorkflowStep[] }
export type WorkflowStep = MethodStep | IfStep | LoopStep
export type WorkflowDsl = { steps: WorkflowStep[] }

/**
 * Builds the workflow schema around a method-step schema. The static export below accepts any operation name;
 * the generator passes a union of per-operation schemas so the model can only emit operations, params and
 * fields that exist (see `buildConstrainedSchema`). Every constrained document also parses with the static one.
 */
export function createWorkflowDslSchema(methodStep: z.ZodType<MethodStep>): z.ZodType<WorkflowDsl> {
    const stepSchema: z.ZodType<WorkflowStep> = z.lazy(() => z.union([methodStep, ifStepSchema, loopStepSchema]))
    const ifStepSchema = z.object({
        id: z.string(),
        kind: z.literal('if'),
        condition: conditionSchema,
        then: z.array(stepSchema),
    })
    const loopStepSchema = z.object({
        id: z.string(),
        kind: z.literal('loop'),
        over: stepRefSchema,
        body: z.array(stepSchema),
    })
    return z.object({ steps: z.array(stepSchema) })
}

export const workflowDslSchema = createWorkflowDslSchema(methodStepSchema)
