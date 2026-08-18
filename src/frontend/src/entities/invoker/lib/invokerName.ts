export const INVOKER_NAME_MAX_LENGTH = 200

const ALLOWED_INVOKER_NAME_PATTERN = /^[A-Za-z0-9 _().-]+$/

export const normalizeInvokerName = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : ''

export const isInvokerNameCharacterSetValid = (value: unknown): boolean => {
    const normalized = normalizeInvokerName(value)
    return normalized.length === 0 || ALLOWED_INVOKER_NAME_PATTERN.test(normalized)
}

export const isInvokerNameDotPlacementValid = (value: unknown): boolean => {
    const normalized = normalizeInvokerName(value)
    return normalized.length === 0 || (
        !normalized.startsWith('.') &&
        !normalized.endsWith('.') &&
        !normalized.includes('..')
    )
}

export const isInvokerNameLengthValid = (value: unknown): boolean =>
    normalizeInvokerName(value).length <= INVOKER_NAME_MAX_LENGTH

export const normalizeInvokerNameForComparison = (value: unknown): string =>
    normalizeInvokerName(value).toLowerCase()

export const areInvokerNamesEqual = (left: unknown, right: unknown): boolean =>
    normalizeInvokerNameForComparison(left) === normalizeInvokerNameForComparison(right)
