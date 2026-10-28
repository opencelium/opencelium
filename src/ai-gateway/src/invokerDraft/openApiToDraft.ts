import { parse as parseYaml } from 'yaml'
import { type DraftOperation, type InvokerDraft, DRAFT_METHODS } from './invokerDraft.schema.ts'
import { type JsonObject, bodyOf, isObject, resolveRef } from './openApiSchema.ts'

const MAX_OPERATIONS = 1000
const MAX_DESCRIPTION = 500
// A cheap read without parameters makes a good connection test; these names usually are one.
const TEST_HINT_RE = /\b(ping|health|status|version|me|whoami|current|info|list)/i

/** An OpenAPI 3 or Swagger 2 document from JSON or YAML text; undefined for anything else. */
export function parseOpenApi(text: string): JsonObject | undefined {
    let document: unknown
    try {
        document = JSON.parse(text)
    } catch {
        try {
            document = parseYaml(text, { maxAliasCount: 100 })
        } catch {
            return undefined
        }
    }
    return isObject(document) && (typeof document.openapi === 'string' || typeof document.swagger === 'string') ? document : undefined
}

const pascal = (text: string) => text.split(/[^A-Za-z0-9]+/).filter(Boolean).map((part) => part[0]!.toUpperCase() + part.slice(1)).join('')

/** `operationId` when it is usable as a name, else method plus path: GET /tickets/{id} → getTicketsById. */
function operationName(method: string, path: string, operation: JsonObject): string {
    const id = typeof operation.operationId === 'string' ? operation.operationId.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') : ''
    if (id) return id.slice(0, 120)
    const segments = path.split('/').filter(Boolean).map((segment) => segment.startsWith('{') ? `By${pascal(segment)}` : pascal(segment))
    return `${method.toLowerCase()}${segments.join('')}`.slice(0, 120) || method.toLowerCase()
}

function authOf(spec: JsonObject): InvokerDraft['auth'] {
    const schemes = [isObject(spec.components) ? spec.components.securitySchemes : undefined, spec.securityDefinitions]
        .find(isObject) ?? {}
    for (const value of Object.values(schemes)) {
        const scheme = resolveRef(spec, value)?.schema
        if (!scheme) continue
        if (scheme.type === 'basic' || (scheme.type === 'http' && scheme.scheme === 'basic')) return { kind: 'basic', keyName: '' }
        if ((scheme.type === 'http' && scheme.scheme === 'bearer') || scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
            return { kind: 'bearer', keyName: '' }
        }
        if (scheme.type === 'apiKey' && typeof scheme.name === 'string') {
            return { kind: scheme.in === 'query' ? 'apikeyQuery' : 'apikeyHeader', keyName: scheme.name }
        }
    }
    return { kind: 'none', keyName: '' }
}

function baseUrlOf(spec: JsonObject): string {
    const [server] = Array.isArray(spec.servers) ? spec.servers : []
    // A relative server ("/api/v3") is relative to wherever the spec is hosted; the customer's host goes in front.
    if (isObject(server) && typeof server.url === 'string') {
        const url = server.url.replace(/\/+$/, '')
        return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://{host}${url.startsWith('/') ? url : `/${url}`}`
    }
    if (typeof spec.host !== 'string') return ''
    const scheme = Array.isArray(spec.schemes) && typeof spec.schemes[0] === 'string' ? spec.schemes[0] : 'https'
    return `${scheme}://${spec.host}${typeof spec.basePath === 'string' ? spec.basePath : ''}`.replace(/\/+$/, '')
}

type Parameter = { name: string; in: string; required: boolean; schema?: unknown }

function parametersOf(spec: JsonObject, ...lists: unknown[]): Parameter[] {
    return lists.flatMap((list) => (Array.isArray(list) ? list : [])).flatMap((value): Parameter[] => {
        const parameter = resolveRef(spec, value)?.schema
        return parameter && typeof parameter.name === 'string' && typeof parameter.in === 'string'
            ? [{ name: parameter.name, in: parameter.in, required: parameter.required === true, schema: parameter.schema }]
            : []
    })
}

const jsonContentSchema = (content: unknown) => {
    if (!isObject(content)) return undefined
    const key = Object.keys(content).find((type) => type.includes('json')) ?? Object.keys(content)[0]
    const media = key ? content[key] : undefined
    return isObject(media) ? media.schema : undefined
}

function convertOperation(spec: JsonObject, method: string, path: string, operation: JsonObject, shared: unknown): Omit<DraftOperation, 'name'> {
    const parameters = parametersOf(spec, shared, operation.parameters)
    // Required query parameters become placeholders the workflow fills; optional ones are left to the user.
    const query = parameters.filter((parameter) => parameter.in === 'query' && parameter.required)
        .map((parameter) => `${parameter.name}={${parameter.name}}`)
    // OpenAPI 3 has a requestBody; Swagger 2 a parameter "in: body".
    const requestSchema = isObject(operation.requestBody)
        ? jsonContentSchema(resolveRef(spec, operation.requestBody)?.schema.content)
        : parameters.find((parameter) => parameter.in === 'body')?.schema
    const responses = isObject(operation.responses) ? operation.responses : {}
    const status = Object.keys(responses).find((code) => /^2\d\d$/.test(code)) ?? '200'
    const response = resolveRef(spec, responses[status])?.schema
    const responseSchema = response ? response.schema ?? jsonContentSchema(response.content) : undefined
    const text = [operation.summary, operation.description].find((value) => typeof value === 'string')
    return {
        method: method.toUpperCase() as DraftOperation['method'],
        path: query.length ? `${path}?${query.join('&')}` : path,
        summary: typeof text === 'string' ? text.split('\n')[0]!.slice(0, MAX_DESCRIPTION) : '',
        group: Array.isArray(operation.tags) && typeof operation.tags[0] === 'string' ? operation.tags[0] : path.split('/').filter(Boolean)[0] ?? '',
        request: requestSchema === undefined ? null : bodyOf(spec, requestSchema),
        response: { status, ...(bodyOf(spec, responseSchema) ?? { type: 'object', fields: [] }) },
    }
}

/** A draft straight from an OpenAPI / Swagger document: no model involved, so every field is exactly what it declares. */
export function openApiToDraft(spec: JsonObject): InvokerDraft {
    const info = isObject(spec.info) ? spec.info : {}
    const paths = isObject(spec.paths) ? spec.paths : {}
    const used = new Set<string>()
    const operations: DraftOperation[] = []
    for (const [path, item] of Object.entries(paths)) {
        if (!isObject(item)) continue
        for (const method of DRAFT_METHODS.map((name) => name.toLowerCase())) {
            const operation = item[method]
            if (!isObject(operation) || operations.length >= MAX_OPERATIONS) continue
            let name = operationName(method, path, operation)
            for (let suffix = 2; used.has(name); suffix++) name = `${operationName(method, path, operation)}_${suffix}`
            used.add(name)
            operations.push({ name, ...convertOperation(spec, method, path, operation, item.parameters) })
        }
    }
    const reads = operations.filter((operation) => operation.method === 'GET' && !operation.path.includes('{'))
    const test = reads.find((operation) => TEST_HINT_RE.test(operation.name) || TEST_HINT_RE.test(operation.path)) ?? reads[0]
    const docs = isObject(spec.externalDocs) && typeof spec.externalDocs.url === 'string' ? spec.externalDocs.url : ''
    const title = typeof info.title === 'string' && info.title.trim() ? info.title.trim() : 'API'
    return {
        name: title.slice(0, 120),
        description: typeof info.description === 'string' ? info.description.trim().slice(0, MAX_DESCRIPTION) : '',
        hint: docs ? `API documentation: ${docs}` : `Created from the ${title} OpenAPI description${typeof info.version === 'string' ? ` (version ${info.version})` : ''}.`,
        category: '',
        auth: authOf(spec),
        baseUrl: baseUrlOf(spec),
        operations,
        testOperation: test?.name ?? '',
    }
}
