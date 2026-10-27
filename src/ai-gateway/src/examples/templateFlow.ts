import {
    type RawBinding, type RawConnector, type RawMethod, type RawOperator, bindingValue, bodyValues, compareIndex,
    describeCondition, list, methodsByColor, readConnection, readablePath, segments, str,
} from './templateJson.ts'

/**
 * A stored template read as a worked example: what it does (name, description), its steps as plan lines with real
 * operation names, nesting and conditions, and the fields each operation sets as separate rule lines. Values stay out of
 * the steps: a model copies the example's shape, and a step carrying "=" reads back as a field rule, not as a call.
 */
export type TemplateFlow = {
    id: string
    name: string
    description: string
    systems: { from: string; to: string }
    /** Distinct operation names each connector calls, to see whether the template fits a request's systems and direction. */
    operations: { from: string[]; to: string[] }
    steps: TemplateStep[]
    /** "<Operation> set <field> = <value>; …", the form the planner gives its own field rules in. */
    fieldRules: string[]
}

/** One plan-like line; `operation` is set on calls, so a request can mark operations its systems lack. */
export type TemplateStep = { depth: number; text: string; operation?: string }

const MAX_STEPS = 32
const MAX_FIELDS_PER_OPERATION = 5
const MAX_RULE_LINES = 8
const MAX_CONSTANTS = 3
const MAX_CONSTANT_LENGTH = 80

type Node = { index: string; text: string; operation?: string }

/** Field rules per operation; an operation called twice (create in two branches) lists each field once. */
function fieldRulesOf(bindings: RawBinding[], methodByColor: Map<string, string>): string[] {
    const byOperation = new Map<string, Map<string, string>>()
    for (const binding of bindings) {
        const target = binding.to?.[0]
        const operation = methodByColor.get(str(target?.color))
        const field = readablePath(str(target?.field))
        const value = bindingValue(binding, methodByColor)
        if (!operation || !field || !value) continue
        const fields = byOperation.get(operation) ?? new Map<string, string>()
        if (!fields.has(field)) fields.set(field, value)
        byOperation.set(operation, fields)
    }
    return [...byOperation].slice(0, MAX_RULE_LINES).map(([operation, fields]) => {
        const shown = [...fields].slice(0, MAX_FIELDS_PER_OPERATION).map(([field, value]) => `${field} = ${value}`)
        return `${operation} set ${shown.join('; ')}${fields.size > MAX_FIELDS_PER_OPERATION ? '; ...' : ''}`
    })
}

/**
 * Fixed values a call sends (a search query, a target state): often the very filter or status the task is about.
 * Quoted without "=", so a copied step still reads as a call.
 */
const constantsOf = (method: RawMethod) => bodyValues(method.request?.body?.fields)
    .filter((value) => !value.isReference && value.text.length <= MAX_CONSTANT_LENGTH)
    .slice(0, MAX_CONSTANTS)
    .map((value) => `${value.key} "${value.text}"`)

function connectorNodes(connector: RawConnector | undefined, methodByColor: Map<string, string>): Node[] {
    const system = str(connector?.invoker?.name)
    const methods = list<RawMethod>(connector?.methods).map((method): Node => {
        const constants = constantsOf(method)
        const sends = constants.length ? ` with ${constants.join(', ')}` : ''
        return { index: str(method.index), operation: str(method.name), text: `Call ${str(method.name)}${system ? ` (${system})` : ''}${sends}.` }
    })
    const operators = list<RawOperator>(connector?.operators).map((operator): Node => {
        const condition = describeCondition(operator.condition, methodByColor)
        return operator.type === 'loop'
            ? { index: str(operator.index), text: `For each item of ${condition || 'a list'}:` }
            : { index: str(operator.index), text: `If ${condition}:` }
    })
    return [...methods, ...operators].sort((left, right) => compareIndex(left.index, right.index))
}

/** Reads one template file's JSON; undefined when it holds no workflow. */
export function parseTemplateFlow(id: string, json: unknown): TemplateFlow | undefined {
    const { template, connection } = readConnection(json)
    const connectors = [connection.fromConnector, connection.toConnector]
    const methods = connectors.flatMap((connector) => list<RawMethod>(connector?.methods))
    const operationsOf = (connector: RawConnector | undefined) =>
        [...new Set(list<RawMethod>(connector?.methods).map((method) => str(method.name)).filter(Boolean))]
    if (methods.length === 0) return undefined
    const methodByColor = methodsByColor(methods)
    const nodes = connectors.flatMap((connector) => connectorNodes(connector, methodByColor))
    const steps = nodes.slice(0, MAX_STEPS).map((node): TemplateStep =>
        ({ depth: segments(node.index).length - 1, text: node.text, operation: node.operation }))
    if (nodes.length > MAX_STEPS) steps.push({ depth: 0, text: `... (${nodes.length - MAX_STEPS} more steps)` })
    return {
        id,
        name: str(template.name) || id,
        description: str(template.description),
        systems: { from: str(connection.fromConnector?.invoker?.name), to: str(connection.toConnector?.invoker?.name) },
        operations: { from: operationsOf(connection.fromConnector), to: operationsOf(connection.toConnector) },
        steps,
        fieldRules: fieldRulesOf(list<RawBinding>(connection.fieldBinding), methodByColor),
    }
}
