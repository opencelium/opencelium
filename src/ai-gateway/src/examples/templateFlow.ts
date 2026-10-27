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

type RawStatement = { color?: unknown; field?: unknown; rightPropertyValue?: unknown }
type RawCondition = { leftStatement?: RawStatement; relationalOperator?: unknown; rightStatement?: RawStatement | null }
type RawMethod = { name?: unknown; index?: unknown; color?: unknown; request?: { body?: { fields?: unknown } | null } }
type RawOperator = { index?: unknown; type?: unknown; condition?: RawCondition }
type RawConnector = { invoker?: { name?: unknown }; methods?: unknown; operators?: unknown }
type RawEndpoint = { color?: unknown; field?: unknown }
type RawBinding = { from?: RawEndpoint[]; to?: RawEndpoint[]; enhancement?: { expertCode?: unknown } }

const MAX_STEPS = 32
const MAX_FIELDS_PER_OPERATION = 5
const MAX_RULE_LINES = 8
const MAX_CONSTANTS = 3
const MAX_CONSTANT_LENGTH = 80
// JSON-RPC envelope keys repeat on every call of an RPC API and say nothing about this call.
const ENVELOPE_KEYS = new Set(['method', 'id', 'jsonrpc', 'version', 'apikey', 'language'])
const PASS_THROUGH_RE = /^\s*RESULT_VAR\s*=\s*VAR_\d+\s*;?\s*$/

const OPERATOR_WORDS: Record<string, string> = {
    '=': 'equals', '!=': 'does not equal', '>': 'is greater than', '<': 'is less than',
    Contains: 'contains', NotContains: 'does not contain', ContainsSubStr: 'contains the text', NotContainsSubStr: 'does not contain the text',
    IsEmpty: 'is empty', NotEmpty: 'is not empty', IsNull: 'is missing', NotNull: 'is set',
    PropertyExists: 'has the property', PropertyNotExists: 'lacks the property',
    AllowList: 'is one of', DenyList: 'is none of', Like: 'matches', NotLike: 'does not match',
}

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : [])

/** `success.result[i].title` → `result.title`: the response wrapper and array markers say nothing to a planner. */
export const readablePath = (field: string) =>
    field.replace(/^(success|fail)\.?/, '').replace(/^body\.\$\./, '').replace(/\[[^\]]*]/g, '').replace(/^\.+|\.+$/g, '')

const segments = (index: string) => index.split('_').map((part) => Number.parseInt(part, 10) || 0)

function compareIndex(left: string, right: string): number {
    const [a, b] = [segments(left), segments(right)]
    for (let position = 0; position < Math.max(a.length, b.length); position++) {
        const difference = (a[position] ?? -1) - (b[position] ?? -1)
        if (difference !== 0) return difference
    }
    return 0
}

type Node = { index: string; text: string; operation?: string }

function describeCondition(condition: RawCondition | undefined, methodByColor: Map<string, string>): string {
    const ref = (statement: RawStatement | null | undefined) => {
        const method = methodByColor.get(str(statement?.color))
        const path = readablePath(str(statement?.field))
        return method ? `${method} ${path || 'result'}`.trim() : path ? `"${str(statement?.field)}"` : ''
    }
    const property = str(condition?.rightStatement?.rightPropertyValue)
    const left = `${ref(condition?.leftStatement)}${property ? `.${property}` : ''}`
    const operator = str(condition?.relationalOperator)
    const right = ref(condition?.rightStatement)
    return [left, OPERATOR_WORDS[operator] ?? operator, right].filter(Boolean).join(' ')
}

/** Field rules per operation; an operation called twice (create in two branches) lists each field once. */
function fieldRulesOf(bindings: RawBinding[], methodByColor: Map<string, string>): string[] {
    const byOperation = new Map<string, Map<string, string>>()
    for (const binding of bindings) {
        const target = binding.to?.[0]
        const operation = methodByColor.get(str(target?.color))
        const field = readablePath(str(target?.field))
        if (!operation || !field) continue
        const code = str(binding.enhancement?.expertCode)
        const sources = (binding.from ?? []).map((source) => `${methodByColor.get(str(source.color)) ?? ''} ${readablePath(str(source.field))}`.trim())
        const value = code && !PASS_THROUGH_RE.test(code)
            ? `script: computed from ${sources.join(', ')}`
            : sources[0] ? `item ${sources[0]}` : ''
        if (!value) continue
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
 * Placeholders and references are left out; quoted without "=", so a copied step still reads as a call.
 */
function constantsOf(method: RawMethod): string[] {
    const found: string[] = []
    const visit = (value: unknown, key: string) => {
        if (found.length >= MAX_CONSTANTS) return
        if (Array.isArray(value)) {
            if (value.every((item) => typeof item === 'string')) visit(value.join(','), key)
            else value.forEach((item) => visit(item, key))
        } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([name, nested]) => visit(nested, name))
        } else if (typeof value === 'string') {
            const text = value.trim()
            const isPlaceholder = !text || /^[{#]/.test(text) || text.includes('{%') || text.includes('(response)')
            if (!isPlaceholder && !ENVELOPE_KEYS.has(key) && text.length <= MAX_CONSTANT_LENGTH) found.push(`${key} "${text}"`)
        }
    }
    visit(method.request?.body?.fields, '')
    return found
}

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
    const template = (typeof json === 'object' && json !== null ? json : {}) as { name?: unknown; description?: unknown; connection?: unknown }
    const connection = (template.connection ?? {}) as { fromConnector?: RawConnector; toConnector?: RawConnector; fieldBinding?: unknown }
    const connectors = [connection.fromConnector, connection.toConnector]
    const methods = connectors.flatMap((connector) => list<RawMethod>(connector?.methods))
    const operationsOf = (connector: RawConnector | undefined) =>
        [...new Set(list<RawMethod>(connector?.methods).map((method) => str(method.name)).filter(Boolean))]
    if (methods.length === 0) return undefined
    const methodByColor = new Map(methods.map((method) => [str(method.color), str(method.name)]))
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
