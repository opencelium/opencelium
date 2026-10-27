import { z } from 'zod'

export const CONNECTOR_SIDES = ['from', 'to'] as const
export const CONDITION_OPS = ['eq', 'ne', 'gt', 'lt', 'contains', 'not_contains', 'exists', 'empty'] as const

/** Operators that test the left value alone; their right value is ignored. */
export const UNARY_CONDITION_OPS: ReadonlySet<ConditionOp> = new Set<ConditionOp>(['exists', 'empty'])

export type ConditionOp = (typeof CONDITION_OPS)[number]

export type ConnectorSide = (typeof CONNECTOR_SIDES)[number]

/**
 * `step` is an earlier method step (path into its response) or an enclosing loop (path inside the current array
 * element). Models write loop elements this way unprompted, so the DSL has a single reference form.
 */
export const stepRefSchema = z.object({ step: z.string(), path: z.string() })

export const valueSchema = z.union([z.object({ literal: z.string() }), z.object({ ref: stepRefSchema })])

/**
 * A transformation (OpenCelium "enhancement"): `inputs[n]` arrive as `VAR_n`, the code assigns `RESULT_VAR`. Nashorn
 * runs it, so the code is ECMAScript 5.1. Only body fields take one; URL params and conditions cannot.
 */
export const scriptValueSchema = z.object({
    script: z.object({
        inputs: z.array(stepRefSchema).min(1),
        code: z.string(),
        description: z.string(),
    }),
})

export const fieldValueSchema = z.union([valueSchema, scriptValueSchema])

export const assignmentSchema = z.object({ name: z.string(), value: valueSchema })

export const fieldAssignmentSchema = z.object({ name: z.string(), value: fieldValueSchema })

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
    fields: z.array(fieldAssignmentSchema),
})

export type DslValue = z.infer<typeof valueSchema>
export type ScriptValue = z.infer<typeof scriptValueSchema>
export type FieldValue = z.infer<typeof fieldValueSchema>
export type FieldAssignment = z.infer<typeof fieldAssignmentSchema>
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
