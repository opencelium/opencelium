import type { ConfigValue } from '@entities/systemConfig/model/types'

function isPlainObject(value: unknown): value is { [key: string]: ConfigValue } {
    return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    )
}

export function buildPatch(
    original: ConfigValue,
    modified: ConfigValue,
): ConfigValue | undefined {
    if (Array.isArray(original) || Array.isArray(modified)) {
        return JSON.stringify(original) === JSON.stringify(modified)
            ? undefined
            : modified
    }

    if (isPlainObject(original) && isPlainObject(modified)) {
        const out: { [key: string]: ConfigValue } = {}
        let dirty = false
        for (const key of Object.keys(modified)) {
            const partial = buildPatch(original[key], modified[key])
            if (partial !== undefined) {
                out[key] = partial
                dirty = true
            }
        }
        return dirty ? out : undefined
    }

    return original === modified ? undefined : modified
}
