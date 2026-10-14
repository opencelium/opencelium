import type {
    TestMethodRequest,
    TestMethodResponse,
    TestMethodSentRequest,
} from '@features/workflow/test-method/testMethod.types'

// Stand-in for the backend: substitutes each supplied value for its reference and
// echoes the resolved request back. Enhancement scripts are treated as the default
// `RESULT_VAR = VAR_0` — running them is the part only the backend can do.

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const asText = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value))

type Substitution = { pattern: RegExp; whole: RegExp; value: unknown }

const buildSubstitutions = (request: TestMethodRequest): Substitution[] => [
    ...request.references.map(({ reference, value }) => {
        const source = `(?:\\{%\\s*${escapeRegExp(reference)}\\s*%\\}|${escapeRegExp(reference)})`
        return { pattern: new RegExp(source, 'g'), whole: new RegExp(`^${source}$`), value }
    }),
    ...request.webhooks.map(({ name, value }) => {
        const source = `\\$\\{${escapeRegExp(name)}(?::[a-z]+)?\\}`
        return { pattern: new RegExp(source, 'g'), whole: new RegExp(`^${source}$`), value }
    }),
]

const substitute = (value: unknown, substitutions: Substitution[]): unknown => {
    if (typeof value === 'string') {
        // A field holding nothing but one reference takes the value's own type.
        const whole = substitutions.find((item) => item.whole.test(value.trim()))
        if (whole) return whole.value
        return substitutions.reduce((text, item) => text.replace(item.pattern, () => asText(item.value)), value)
    }
    if (Array.isArray(value)) return value.map((item) => substitute(item, substitutions))
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, substitute(nested, substitutions)]))
    }
    return value
}

const readFields = (body: unknown) =>
    body && typeof body === 'object' && 'fields' in body ? (body as { fields: unknown }).fields : body

export function simulateTestMethod(request: TestMethodRequest): TestMethodResponse {
    const substitutions = buildSubstitutions(request)
    const { endpoint, method, header, body } = request.method.request
    const sent: TestMethodSentRequest = {
        url: asText(substitute(endpoint, substitutions)),
        method,
        headers: substitute(header, substitutions) as Record<string, string>,
        body: substitute(readFields(body), substitutions),
    }
    if (/\{%|#[A-Fa-f0-9]{6}\.\((?:request|response)\)/.test(sent.url)) {
        return { kind: 'error', stage: 'resolve', message: 'The URL still contains an unresolved reference.', request: sent }
    }
    return {
        kind: 'success',
        request: sent,
        response: {
            status: 200,
            headers: { 'content-type': 'application/json', 'x-mock': 'test-method' },
            body: { mocked: true, receivedBody: sent.body },
        },
        durationMs: 120 + Math.round(Math.random() * 300),
    }
}
