export type MaskSection = 'url' | 'headers' | 'request' | 'response'

export type MaskingLevel = 'custom' | 'light' | 'medium' | 'strict'

export type MaskingRule = {
    expression: string
    type: 'JSONPath'
}

export type MaskState = Record<MaskSection, boolean>

// Payload order is significant: url → rule1, header → rule2,
// request body → rule3, response body → rule4.
export const MASK_SECTIONS: MaskSection[] = ['url', 'headers', 'request', 'response']

export const MASK_RULES: Record<MaskSection, MaskingRule> = {
    url: { expression: '#[*].(request).url', type: 'JSONPath' },
    headers: { expression: '#[*].(request).header', type: 'JSONPath' },
    request: { expression: '#[*].(request).body', type: 'JSONPath' },
    response: { expression: '#[*].(response).body', type: 'JSONPath' },
}

const LEVEL_PRESETS: Record<Exclude<MaskingLevel, 'custom'>, MaskState> = {
    light: { url: true, headers: false, request: false, response: false },
    medium: { url: true, headers: true, request: false, response: false },
    strict: { url: true, headers: true, request: true, response: false },
}

export const MASKING_LEVELS: MaskingLevel[] = ['custom', 'light', 'medium', 'strict']

export function presetForLevel(level: Exclude<MaskingLevel, 'custom'>): MaskState {
    return { ...LEVEL_PRESETS[level] }
}

// Any combination that doesn't match a named preset is reported as 'custom'
// (e.g. enabling the response section, which no preset covers).
export function levelForState(state: MaskState): MaskingLevel {
    for (const level of ['light', 'medium', 'strict'] as const) {
        const preset = LEVEL_PRESETS[level]
        if (MASK_SECTIONS.every((s) => preset[s] === state[s])) return level
    }
    return 'custom'
}

export function buildSupportFilePayload(state: MaskState): MaskingRule[] {
    return MASK_SECTIONS.filter((s) => state[s]).map((s) => MASK_RULES[s])
}

// Sample data shown read-only in the dialog so the user can see what each
// masking rule covers. This is illustrative data, not user-facing UI copy.
export const URL_EXAMPLE = 'https://api.example.com/v1/orders?id=31'

export const HEADERS_EXAMPLE: Record<string, unknown> = {
    Authorization: 'Bearer fj28h9kskfna23mmf92',
    'Content-Type': 'application/json',
}

export const REQUEST_EXAMPLE: Record<string, unknown> = {
    body: { _id: '31' },
}

export const RESPONSE_EXAMPLE: Record<string, unknown> = {
    body: { transactionId: '31', type: 3 },
}

// Replace every visible character in a string with an asterisk while preserving
// whitespace, so a masked value keeps its original shape.
export function maskText(text: string): string {
    return text.replace(/\S/g, '*')
}

// Recursively mask the leaf values of an object/array, leaving keys and the
// tree shape intact so the JSON view still renders structure when masked.
export function maskJson<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((item) => maskJson(item)) as T
    }
    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, val]) => [key, maskJson(val)]),
        ) as T
    }
    if (typeof value === 'string') {
        return maskText(value) as T
    }
    return '***' as T
}
