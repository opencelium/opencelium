import type { EntityDefinition } from '../EntityDefinition'

function setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
) {
    const keys = path.split('.')

    let current = obj

    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            current[key] = value
        } else {
            if (!current[key]) {
                current[key] = {}
            }
            current = current[key]
        }
    })
}

export function buildDefaultValues(entity: EntityDefinition) {
    const result: Record<string, unknown> = {}

    entity.fields.forEach(field => {
        const value =
            field.defaultValue !== undefined
                ? field.defaultValue
                : field.getDefaultValue !== undefined ?
                    field.getDefaultValue()
                    : field.type === 'string'
                    ? ''
                    : field.type === 'number'
                        ? undefined
                        : field.type === 'boolean'
                            ? false
                            : field.type === 'file'
                                ? null
                                : undefined

        setNestedValue(result, field.name, value)
    })

    return result
}
