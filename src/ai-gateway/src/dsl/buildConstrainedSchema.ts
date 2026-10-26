import { z } from 'zod'
import { flattenFieldPaths } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import {
    type ConnectorSide,
    type MethodStep,
    type WorkflowDsl,
    assignmentSchema,
    createWorkflowDslSchema,
    valueSchema,
} from './workflowDsl.schema.ts'

export type WorkflowConnectors = {
    from: Invoker
    to: Invoker | null
}

function assignmentsFor(names: string[]) {
    const [first, ...rest] = names
    if (first === undefined) return z.array(assignmentSchema).max(0)
    return z.array(z.object({ name: z.enum([first, ...rest]), value: valueSchema }))
}

function operationStepSchema(side: ConnectorSide, operation: InvokerOperation): z.ZodType<MethodStep> {
    const fieldNames = [...new Set(flattenFieldPaths(operation.requestFields).map((field) => field.path))]
    return z.object({
        id: z.string(),
        kind: z.literal('method'),
        connector: z.literal(side),
        operation: z.literal(operation.name),
        params: assignmentsFor(operation.endpointParams),
        fields: assignmentsFor(fieldNames),
    })
}

/**
 * One method variant per operation, so the decoder can only produce an operation on the connector that owns it,
 * with that operation's own endpoint params and body fields.
 */
export function buildConstrainedSchema(connectors: WorkflowConnectors): z.ZodType<WorkflowDsl> {
    const variants = [
        ...connectors.from.operations.map((operation) => operationStepSchema('from', operation)),
        ...(connectors.to?.operations ?? []).map((operation) => operationStepSchema('to', operation)),
    ]
    const [first, second, ...rest] = variants
    if (first === undefined) throw new Error('The selected connectors expose no workflow operations')
    const methodStep = second === undefined ? first : z.union([first, second, ...rest])
    return createWorkflowDslSchema(methodStep)
}

export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
    // `reused: 'ref'` hoists the value/assignment shapes into $defs instead of inlining them per operation.
    return z.toJSONSchema(schema, { target: 'draft-2020-12', reused: 'ref' }) as Record<string, unknown>
}
