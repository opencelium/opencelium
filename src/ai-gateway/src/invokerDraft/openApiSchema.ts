import type { DraftBody, DraftField } from './invokerDraft.schema.ts'

export type JsonObject = Record<string, unknown>

// Deeper levels rarely matter for mapping, and recursive schemas (a category with sub-categories) never end.
const MAX_DEPTH = 5
const MAX_PROPERTIES = 150

export const isObject = (value: unknown): value is JsonObject => typeof value === 'object' && value !== null && !Array.isArray(value)

/** Follows a local `$ref` ("#/components/schemas/Ticket"); external references are not resolved. */
export function resolveRef(spec: JsonObject, value: unknown, seen: ReadonlySet<string> = new Set()): { schema: JsonObject; seen: Set<string> } | null {
    if (!isObject(value)) return null
    const ref = value.$ref
    if (typeof ref !== 'string') return { schema: value, seen: new Set(seen) }
    if (!ref.startsWith('#/') || seen.has(ref)) return null
    const target = ref.slice(2).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
        .reduce<unknown>((node, part) => (isObject(node) ? node[part] : undefined), spec)
    return resolveRef(spec, target, new Set([...seen, ref]))
}

/** allOf parts merged, the first oneOf / anyOf alternative taken: enough to know which fields exist. */
function flatten(spec: JsonObject, schema: JsonObject, seen: Set<string>): { schema: JsonObject; seen: Set<string> } {
    const parts = Array.isArray(schema.allOf) ? schema.allOf : []
    const alternative = [schema.oneOf, schema.anyOf].find(Array.isArray)?.[0]
    if (parts.length === 0 && alternative === undefined) return { schema, seen }
    const resolved = [...parts, ...(alternative === undefined ? [] : [alternative])]
        .map((part) => resolveRef(spec, part, seen)).filter((part) => part !== null)
    const properties = Object.assign({}, schema.properties, ...resolved.map((part) => flatten(spec, part.schema, part.seen).schema.properties))
    const type = schema.type ?? resolved.map((part) => part.schema.type).find(Boolean) ?? (Object.keys(properties).length ? 'object' : undefined)
    const items = schema.items ?? resolved.map((part) => part.schema.items).find(Boolean)
    return { schema: { ...schema, type, properties, items }, seen: new Set([...seen, ...resolved.flatMap((part) => [...part.seen])]) }
}

function fieldType(schema: JsonObject): DraftField['type'] {
    switch (schema.type) {
        case 'integer':
        case 'number': return 'number'
        case 'boolean': return 'boolean'
        case 'array': return 'array'
        case 'object': return 'object'
        default: return isObject(schema.properties) ? 'object' : 'string'
    }
}

/** The fields of an object schema, or of the items of an array schema. */
function fieldsOf(spec: JsonObject, schema: JsonObject, seen: Set<string>, depth: number): DraftField[] {
    if (depth > MAX_DEPTH) return []
    const flat = flatten(spec, schema, seen)
    if (flat.schema.type === 'array') {
        const items = resolveRef(spec, flat.schema.items, flat.seen)
        return items ? fieldsOf(spec, items.schema, items.seen, depth) : []
    }
    const properties = isObject(flat.schema.properties) ? Object.entries(flat.schema.properties).slice(0, MAX_PROPERTIES) : []
    return properties.flatMap(([name, value]): DraftField[] => {
        const resolved = resolveRef(spec, value, flat.seen)
        if (!resolved) return [{ name, type: 'object', children: [] }]
        const property = flatten(spec, resolved.schema, resolved.seen)
        const type = fieldType(property.schema)
        const children = type === 'object' || type === 'array' ? fieldsOf(spec, property.schema, property.seen, depth + 1) : []
        return [{ name, type, children }]
    })
}

/** A request or response body from its schema; null when there is no schema. */
export function bodyOf(spec: JsonObject, schemaValue: unknown): DraftBody | null {
    const resolved = resolveRef(spec, schemaValue)
    if (!resolved) return null
    const flat = flatten(spec, resolved.schema, resolved.seen)
    return { type: flat.schema.type === 'array' ? 'array' : 'object', fields: fieldsOf(spec, flat.schema, flat.seen, 0) }
}
