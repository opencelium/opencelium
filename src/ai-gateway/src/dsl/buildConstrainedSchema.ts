import { z } from 'zod'
import { assignableRequestPaths } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import {
    type ConnectorSide,
    type MethodStep,
    type WorkflowDsl,
    createWorkflowDslSchema,
    fieldValueSchema,
    scriptValueSchema,
    valueSchema,
} from './workflowDsl.schema.ts'

export type WorkflowConnectors = {
    from: Invoker
    to: Invoker | null
}

function assignmentsFor<V extends z.ZodType>(names: string[], value: V) {
    const [first, ...rest] = names
    if (first === undefined) return z.array(z.object({ name: z.string(), value })).max(0)
    return z.array(z.object({ name: z.enum([first, ...rest]), value }))
}

/** Fields the plan asks a script for; every other field of that step then takes a plain value only. */
export type ScriptPolicy = { scriptFields: ReadonlySet<string> }

function fieldsFor(names: string[], policy: ScriptPolicy | undefined) {
    if (!policy) return assignmentsFor(names, fieldValueSchema)
    const variants = names.map((name) => z.object({
        name: z.literal(name),
        value: policy.scriptFields.has(name) ? scriptValueSchema : valueSchema,
    }))
    const [first, second, ...rest] = variants
    if (first === undefined) return z.array(z.object({ name: z.string(), value: valueSchema })).max(0)
    return z.array(second === undefined ? first : z.union([first, second, ...rest]))
}

/**
 * A method step limited to one operation's params and body fields; `id` pins the step id when the skeleton fixes it,
 * and `policy` limits scripts to the fields the plan asks a script for.
 */
export function operationStepSchema(side: ConnectorSide, invoker: Invoker, operation: InvokerOperation, id?: string,
    policy?: ScriptPolicy): z.ZodType<MethodStep> {
    const fieldNames = [...new Set(assignableRequestPaths(operation.requestFields, invoker.requiredData).map((field) => field.path))]
    return z.object({
        id: id === undefined ? z.string() : z.literal(id),
        kind: z.literal('method'),
        connector: z.literal(side),
        operation: z.literal(operation.name),
        params: assignmentsFor(operation.endpointParams, valueSchema),
        fields: fieldsFor(fieldNames, policy),
    })
}

/**
 * One method variant per operation, so the decoder can only produce an operation on the connector that owns it,
 * with that operation's own endpoint params and body fields.
 */
export function buildConstrainedSchema(connectors: WorkflowConnectors): z.ZodType<WorkflowDsl> {
    const sides: [ConnectorSide, Invoker][] = [['from', connectors.from]]
    if (connectors.to) sides.push(['to', connectors.to])
    const variants = sides.flatMap(([side, invoker]) =>
        invoker.operations.map((operation) => operationStepSchema(side, invoker, operation)))
    const [first, second, ...rest] = variants
    if (first === undefined) throw new Error('The selected connectors expose no workflow operations')
    const methodStep = second === undefined ? first : z.union([first, second, ...rest])
    return createWorkflowDslSchema(methodStep)
}

/** zod marks a tuple's end with `items: false`; Ollama's grammar converter only accepts object schemas and closes tuples itself. */
function dropBooleanItems(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(dropBooleanItems)
    if (typeof node !== 'object' || node === null) return node
    return Object.fromEntries(Object.entries(node)
        .filter(([key, value]) => !(key === 'items' && value === false))
        .map(([key, value]) => [key, dropBooleanItems(value)]))
}

export function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
    // `reused: 'ref'` hoists the value/assignment shapes into $defs instead of inlining them per operation.
    return dropBooleanItems(z.toJSONSchema(schema, { target: 'draft-2020-12', reused: 'ref' })) as Record<string, unknown>
}
