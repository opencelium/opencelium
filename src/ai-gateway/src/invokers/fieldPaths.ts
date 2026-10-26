import type { FieldNode } from './invoker.types.ts'

const PLACEHOLDER_RE = /\{([^{}]+)\}/g

/**
 * True when a template value is filled from the connector's settings at run time, e.g. `{apikey}` or
 * `Basic {username:password}`. Such fields carry credentials and must never be set by a workflow.
 */
export function isConnectorManaged(value: string, requiredData: string[]): boolean {
    const names = new Set(requiredData.map((name) => name.toLowerCase()))
    return [...value.matchAll(PLACEHOLDER_RE)].some(([, inner = '']) =>
        inner.split(':').some((part) => names.has(part.trim().toLowerCase())),
    )
}

export type FieldPath = {
    path: string
    type: string
}

/** Flattens a field tree into dot paths; array fields get a `[]` suffix (e.g. `issues[].fields.summary`). */
export function flattenFieldPaths(fields: FieldNode[], prefix = '', include: (field: FieldNode) => boolean = () => true): FieldPath[] {
    return fields.filter(include).flatMap((field) => {
        const segment = field.type === 'array' ? `${field.name}[]` : field.name
        const path = prefix ? `${prefix}.${segment}` : segment
        return [{ path, type: field.type || 'string' }, ...flattenFieldPaths(field.children, path, include)]
    })
}

/** Request body paths a workflow may set: everything except connector-managed credentials. */
export function assignableRequestPaths(fields: FieldNode[], requiredData: string[]): FieldPath[] {
    return flattenFieldPaths(fields, '', (field) => !isConnectorManaged(field.value, requiredData))
}

/** Canonical form for comparing paths the model writes (`issues[0].key`, `issues.key`) with declared ones. */
export function normalizePath(path: string): string {
    return path
        .replace(/\[[^\]]*\]/g, '')
        .replace(/^\$\.?/, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.|\.$/g, '')
}
