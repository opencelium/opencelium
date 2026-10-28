/** The parts of a stored template file the examples read, and the helpers that turn them into readable text. */

export type RawStatement = { color?: unknown; field?: unknown; rightPropertyValue?: unknown }
export type RawCondition = { leftStatement?: RawStatement; relationalOperator?: unknown; rightStatement?: RawStatement | null }
export type RawMethod = {
    name?: unknown
    index?: unknown
    color?: unknown
    request?: { endpoint?: unknown; body?: { fields?: unknown } | null }
}
export type RawOperator = { index?: unknown; type?: unknown; condition?: RawCondition }
export type RawConnector = { invoker?: { name?: unknown }; methods?: unknown; operators?: unknown }
export type RawEndpoint = { color?: unknown; field?: unknown }
export type RawBinding = { from?: RawEndpoint[]; to?: RawEndpoint[]; enhancement?: { expertCode?: unknown } }
export type RawTemplate = { name?: unknown; description?: unknown; connection?: unknown }
export type RawConnection = { fromConnector?: RawConnector; toConnector?: RawConnector; fieldBinding?: unknown }

const OPERATOR_WORDS: Record<string, string> = {
    '=': 'equals', '!=': 'does not equal', '>': 'is greater than', '<': 'is less than',
    Contains: 'contains', NotContains: 'does not contain', ContainsSubStr: 'contains the text', NotContainsSubStr: 'does not contain the text',
    IsEmpty: 'is empty', NotEmpty: 'is not empty', IsNull: 'is missing', NotNull: 'is set',
    PropertyExists: 'has the property', PropertyNotExists: 'lacks the property',
    AllowList: 'is one of', DenyList: 'is none of', Like: 'matches', NotLike: 'does not match',
}

const PASS_THROUGH_RE = /^\s*RESULT_VAR\s*=\s*VAR_\d+\s*;?\s*$/
// "#FFCFB5.(response).success.result[i].id", alone or inside "{%…%}" in an endpoint or a body value.
const REFERENCE_RE = /#(\w+)\.\((?:response|request)\)\.([\w.[\]*$-]+)/g
// JSON-RPC envelope keys repeat on every call of an RPC API and say nothing about this call.
const ENVELOPE_KEYS = new Set(['method', 'id', 'jsonrpc', 'version', 'apikey', 'language'])

export const isEnvelopeKey = (key: string) => ENVELOPE_KEYS.has(key)

export const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
export const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : [])

export function readConnection(json: unknown): { template: RawTemplate; connection: RawConnection } {
    const template = (typeof json === 'object' && json !== null ? json : {}) as RawTemplate
    return { template, connection: (template.connection ?? {}) as RawConnection }
}

/** `success.result[i].title` → `result.title`: the response wrapper and array markers say nothing to a planner. */
export const readablePath = (field: string) =>
    field.replace(/^(success|fail)\.?/, '').replace(/^body\.\$\./, '').replace(/\[[^\]]*]/g, '').replace(/^\.+|\.+$/g, '')

export const segments = (index: string) => index.split('_').map((part) => Number.parseInt(part, 10) || 0)

export function compareIndex(left: string, right: string): number {
    const [a, b] = [segments(left), segments(right)]
    for (let position = 0; position < Math.max(a.length, b.length); position++) {
        const difference = (a[position] ?? -1) - (b[position] ?? -1)
        if (difference !== 0) return difference
    }
    return 0
}

/** Template methods are told apart by color; references and bindings point at them through it. */
export const methodsByColor = (methods: RawMethod[]) => new Map(methods.map((method) => [str(method.color), str(method.name)]))

export function describeCondition(condition: RawCondition | undefined, methodByColor: Map<string, string>): string {
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

/** Every reference in a text written readably: `#C77E7E.(response).success.result[0].sys_id` → `IncidentGet result.sys_id`. */
export function replaceReferences(text: string, methodByColor: Map<string, string>): string {
    return text.replace(REFERENCE_RE, (_match, color: string, path: string) =>
        `${methodByColor.get(`#${color}`) ?? 'step'} ${readablePath(path)}`.trim())
}

export const hasReference = (text: string) => new RegExp(REFERENCE_RE.source).test(text)

export type BodyValue = { path: string; key: string; text: string; isReference: boolean }

/** The leaf values of a request body with their dotted paths; placeholders such as `{apikey}` and envelope keys are left out. */
export function bodyValues(fields: unknown): BodyValue[] {
    const found: BodyValue[] = []
    const visit = (value: unknown, path: string, key: string) => {
        if (Array.isArray(value)) {
            if (value.every((item) => typeof item === 'string')) visit(value.join(','), path, key)
            else value.forEach((item) => visit(item, path, key))
        } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([name, nested]) => visit(nested, path ? `${path}.${name}` : name, name))
        } else if (typeof value === 'string') {
            const text = value.trim()
            const isPlaceholder = !text || /^\{[^%]/.test(text)
            if (!isPlaceholder && !ENVELOPE_KEYS.has(key)) found.push({ path, key, text, isReference: hasReference(text) })
        }
    }
    visit(fields, '', '')
    return found
}

/** A binding's value in plan words: `item <source>` for a copy, `script: computed from …` for a transformation. */
export function bindingValue(binding: RawBinding, methodByColor: Map<string, string>): string {
    const code = str(binding.enhancement?.expertCode)
    const sources = (binding.from ?? []).map((source) => `${methodByColor.get(str(source.color)) ?? ''} ${readablePath(str(source.field))}`.trim())
    if (code && !PASS_THROUGH_RE.test(code)) return `script: computed from ${sources.join(', ')}`
    return sources[0] ? `item ${sources[0]}` : ''
}
