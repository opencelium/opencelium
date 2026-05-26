import type { ConfigValue } from '@entities/systemConfig/model/types'

export type ConfigSegment = string | number

export function parsePath(path: string): ConfigSegment[] {
    const segments: ConfigSegment[] = []
    const parts = path.split('.')
    for (const part of parts) {
        const match = /^([^[\]]+)((?:\[\d+\])*)$/.exec(part)
        if (!match) continue
        const [, name, indices] = match
        if (name) segments.push(name)
        if (indices) {
            const indexMatches = indices.match(/\[(\d+)\]/g) ?? []
            for (const m of indexMatches) {
                segments.push(Number(m.slice(1, -1)))
            }
        }
    }
    return segments
}

function cloneShallow<T extends ConfigValue>(value: T): T {
    if (Array.isArray(value)) return [...value] as unknown as T
    if (value !== null && typeof value === 'object') return { ...value } as T
    return value
}

export function setValueAtPath(
    root: ConfigValue,
    segments: ConfigSegment[],
    value: ConfigValue,
): ConfigValue {
    if (segments.length === 0) return value
    const [head, ...rest] = segments
    const cloned = cloneShallow(root)

    if (typeof head === 'number') {
        const arr = Array.isArray(cloned) ? (cloned as ConfigValue[]) : []
        arr[head] = setValueAtPath(arr[head] ?? null, rest, value)
        return arr as ConfigValue
    }

    const obj = (
        cloned !== null && typeof cloned === 'object' && !Array.isArray(cloned)
            ? cloned
            : {}
    ) as { [key: string]: ConfigValue }
    obj[head] = setValueAtPath(obj[head] ?? null, rest, value)
    return obj
}
