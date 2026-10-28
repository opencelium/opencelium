import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { WorkflowDsl, WorkflowStep } from '../dsl/workflowDsl.schema.ts'
import {
    type RawBinding, type RawConnector, type RawMethod, type RawOperator, bodyValues, isEnvelopeKey, list, readConnection,
    readablePath, str,
} from '../examples/templateJson.ts'
import { normalizePath } from '../invokers/fieldPaths.ts'

/**
 * What a workflow does, in comparable terms: the operations it calls (`from:host.get`), each call with the loops and
 * ifs around it (`to:host.delete@loop>if`), and the fields it sets (`to:host.delete params`).
 */
export type WorkflowShape = { operations: Set<string>; placements: Set<string>; fields: Set<string> }

export type WorkflowScore = {
    operationRecall: number
    operationPrecision: number
    /** Share of the template's calls made by the same operation inside the same kinds of loops and ifs. */
    placementRecall: number
    fieldRecall: number
    fieldPrecision: number
}

type Kind = 'loop' | 'if'

const placement = (key: string, kinds: Kind[]) => `${key}@${kinds.join('>')}`
// Only the leaf path counts: `params.filter.title` and `params.filter.title[]` set the same thing.
const fieldKey = (operationKey: string, path: string) => `${operationKey} ${normalizePath(readablePath(path))}`

function emptyShape(): WorkflowShape {
    return { operations: new Set(), placements: new Set(), fields: new Set() }
}

/**
 * The shape of a stored template, limited to operations the installed invokers still have: a removed operation cannot
 * be generated, so counting it would only measure how stale the template is.
 */
export function templateShape(json: unknown, connectors: WorkflowConnectors): WorkflowShape {
    const { connection } = readConnection(json)
    const shape = emptyShape()
    const sides: ['from' | 'to', RawConnector | undefined][] = [['from', connection.fromConnector], ['to', connection.toConnector]]
    const keyByColor = new Map<string, string>()
    for (const [side, connector] of sides) {
        const invoker = side === 'from' ? connectors.from : connectors.to
        const operators = list<RawOperator>(connector?.operators)
        for (const method of list<RawMethod>(connector?.methods)) {
            const name = str(method.name)
            if (!invoker?.operations.some((operation) => operation.name === name)) continue
            const key = `${side}:${name}`
            const index = str(method.index)
            const kinds = operators
                .filter((operator) => index.startsWith(`${str(operator.index)}_`))
                .sort((left, right) => str(left.index).length - str(right.index).length)
                .map((operator): Kind => (operator.type === 'loop' ? 'loop' : 'if'))
            shape.operations.add(key)
            shape.placements.add(placement(key, kinds))
            keyByColor.set(str(method.color), key)
            for (const value of bodyValues(method.request?.body?.fields)) shape.fields.add(fieldKey(key, value.path))
        }
    }
    for (const binding of list<RawBinding>(connection.fieldBinding)) {
        const key = keyByColor.get(str(binding.to?.[0]?.color))
        const field = str(binding.to?.[0]?.field)
        if (key && field) shape.fields.add(fieldKey(key, field))
    }
    return shape
}

export function dslShape(dsl: WorkflowDsl): WorkflowShape {
    const shape = emptyShape()
    const walk = (steps: WorkflowStep[], kinds: Kind[]) => {
        for (const step of steps) {
            switch (step.kind) {
                case 'method': {
                    const key = `${step.connector}:${step.operation}`
                    shape.operations.add(key)
                    shape.placements.add(placement(key, kinds))
                    // Templates leave the JSON-RPC envelope (method, id, jsonrpc) to the invoker; it is no mapping.
                    for (const field of step.fields) {
                        if (!isEnvelopeKey(field.name.split('.').at(-1) ?? '')) shape.fields.add(fieldKey(key, field.name))
                    }
                    break
                }
                case 'loop':
                    walk(step.body, [...kinds, 'loop'])
                    break
                case 'if':
                    walk(step.then, [...kinds, 'if'])
                    break
                default: {
                    const _exhaustive: never = step
                    return _exhaustive
                }
            }
        }
    }
    walk(dsl.steps, [])
    return shape
}

/** Share of `wanted` found in `got`; 1 when nothing is wanted, so an empty side neither helps nor hurts. */
function share(wanted: Set<string>, got: Set<string>): number {
    if (wanted.size === 0) return 1
    return [...wanted].filter((item) => got.has(item)).length / wanted.size
}

export function scoreWorkflow(truth: WorkflowShape, generated: WorkflowShape): WorkflowScore {
    return {
        operationRecall: share(truth.operations, generated.operations),
        operationPrecision: share(generated.operations, truth.operations),
        placementRecall: share(truth.placements, generated.placements),
        fieldRecall: share(truth.fields, generated.fields),
        fieldPrecision: share(generated.fields, truth.fields),
    }
}
