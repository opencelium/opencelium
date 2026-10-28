import type { DraftBody, DraftField, DraftOperation, InvokerDraft } from './invokerDraft.schema.ts'

type RequiredItem = { name: string; visibility: 'public' | 'protected' | 'private'; value?: string }
type Auth = { items: RequiredItem[]; authType: string; headers: [string, string][]; query?: [string, string] }

const TEST_OPERATION_NAME = 'TestConnection'
const INDENT = '    '

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Connector settings each kind of authentication needs, and where they go in every request. */
function authOf(draft: InvokerDraft): Auth {
    const url: RequiredItem = { name: 'url', visibility: 'public', value: draft.baseUrl || undefined }
    const { kind, keyName } = draft.auth
    switch (kind) {
        case 'none':
            return { items: [url], authType: 'none', headers: [] }
        case 'basic':
            return {
                items: [url, { name: 'username', visibility: 'public' }, { name: 'password', visibility: 'protected' },
                    { name: 'token', visibility: 'private', value: 'Basic {username:password}' }],
                authType: 'basic', headers: [['Authorization', '{token}']],
            }
        case 'bearer':
            return { items: [url, { name: 'token', visibility: 'protected' }], authType: 'token', headers: [['Authorization', 'Bearer {token}']] }
        case 'apikeyHeader':
            return { items: [url, { name: 'apikey', visibility: 'protected' }], authType: 'apikey', headers: [[keyName || 'X-API-Key', '{apikey}']] }
        case 'apikeyQuery':
            return { items: [url, { name: 'apikey', visibility: 'protected' }], authType: 'apikey', headers: [], query: [keyName || 'api_key', '{apikey}'] }
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}

function fieldsXml(fields: DraftField[], depth: number): string[] {
    const pad = INDENT.repeat(depth)
    return fields.flatMap((field) => field.children.length
        ? [`${pad}<field name="${escape(field.name)}" type="${field.type}">`, ...fieldsXml(field.children, depth + 1), `${pad}</field>`]
        : [`${pad}<field name="${escape(field.name)}" type="${field.type}"/>`])
}

function bodyXml(body: DraftBody | null, depth: number): string[] {
    const pad = INDENT.repeat(depth)
    if (!body) return [`${pad}<body/>`]
    if (body.fields.length === 0) return [`${pad}<body data="raw" format="json" type="${body.type}"/>`]
    return [`${pad}<body data="raw" format="json" type="${body.type}">`, ...fieldsXml(body.fields, depth + 1), `${pad}</body>`]
}

/**
 * A path placeholder named like a connector setting ({token}) would be filled from the connector instead of by the
 * workflow, so it gets a distinct name.
 */
function endpointOf(operation: DraftOperation, auth: Auth): string {
    const reserved = new Set(auth.items.map((item) => item.name))
    const path = operation.path.replace(/\{([^{}]+)\}/g, (match, name: string) => (reserved.has(name) ? `{${name}Param}` : match))
    const endpoint = `{url}${path.startsWith('/') ? path : `/${path}`}`
    if (!auth.query) return endpoint
    return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${auth.query[0]}=${auth.query[1]}`
}

function operationXml(operation: DraftOperation, type: '' | 'test', auth: Auth, name = operation.name): string[] {
    const headers: [string, string][] = [...auth.headers, ['Accept', 'application/json']]
    if (operation.request) headers.push(['Content-Type', 'application/json'])
    const pad = (depth: number) => INDENT.repeat(depth)
    return [
        `${pad(2)}<operation name="${escape(name)}" type="${type}">`,
        `${pad(3)}<request>`,
        `${pad(4)}<method>${operation.method}</method>`,
        `${pad(4)}<endpoint>${escape(endpointOf(operation, auth))}</endpoint>`,
        `${pad(4)}<header>`,
        ...headers.map(([header, value]) => `${pad(5)}<item name="${escape(header)}" type="string">${escape(value)}</item>`),
        `${pad(4)}</header>`,
        ...bodyXml(operation.request, 4),
        `${pad(3)}</request>`,
        `${pad(3)}<response>`,
        `${pad(4)}<success status="${escape(operation.response.status || '200')}">`,
        `${pad(5)}<header/>`,
        ...bodyXml(operation.response, 5),
        `${pad(4)}</success>`,
        `${pad(4)}<fail status="400">`,
        `${pad(5)}<header/>`,
        `${pad(5)}<body/>`,
        `${pad(4)}</fail>`,
        `${pad(3)}</response>`,
        `${pad(2)}</operation>`,
    ]
}

/**
 * The backend's invoker XML for a reviewed draft. The connection test is its own operation (a copy of the chosen GET):
 * an operation typed "test" is hidden from workflows, and the original should stay usable in them.
 */
export function buildInvokerXml(draft: InvokerDraft): string {
    const auth = authOf(draft)
    const test = draft.operations.find((operation) => operation.name === draft.testOperation)
    const testName = draft.operations.some((operation) => operation.name === TEST_OPERATION_NAME) ? `${TEST_OPERATION_NAME}Check` : TEST_OPERATION_NAME
    const items = auth.items.map((item) => item.value
        ? `${INDENT.repeat(2)}<item name="${item.name}" type="string" visibility="${item.visibility}">${escape(item.value)}</item>`
        : `${INDENT.repeat(2)}<item name="${item.name}" type="string" visibility="${item.visibility}"/>`)
    return [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
        '<invoker type="RESTful">',
        `${INDENT}<name>${escape(draft.name)}</name>`,
        `${INDENT}<description>${escape(draft.description)}</description>`,
        `${INDENT}<hint>${escape(draft.hint)}</hint>`,
        `${INDENT}<requiredData>`, ...items, `${INDENT}</requiredData>`,
        `${INDENT}<authType>${auth.authType}</authType>`,
        ...(draft.category ? [`${INDENT}<category_tags>`, `${INDENT.repeat(2)}<item>${escape(draft.category)}</item>`, `${INDENT}</category_tags>`] : []),
        `${INDENT}<operations>`,
        ...(test ? operationXml(test, 'test', auth, testName) : []),
        ...draft.operations.flatMap((operation) => operationXml(operation, '', auth)),
        `${INDENT}</operations>`,
        '</invoker>',
        '',
    ].join('\n')
}
