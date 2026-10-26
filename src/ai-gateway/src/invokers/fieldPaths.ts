import type { FieldNode } from './invoker.types.ts'

export type FieldPath = {
    path: string
    type: string
}

/** Flattens a field tree into dot paths; array fields get a `[]` suffix (e.g. `issues[].fields.summary`). */
export function flattenFieldPaths(fields: FieldNode[], prefix = ''): FieldPath[] {
    return fields.flatMap((field) => {
        const segment = field.type === 'array' ? `${field.name}[]` : field.name
        const path = prefix ? `${prefix}.${segment}` : segment
        return [{ path, type: field.type || 'string' }, ...flattenFieldPaths(field.children, path)]
    })
}

/** Canonical form for comparing paths the model writes (`issues[0].key`, `issues.key`) with declared ones. */
export function normalizePath(path: string): string {
    return path
        .replace(/\[[^\]]*\]/g, '')
        .replace(/^\$\.?/, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\.|\.$/g, '')
}
