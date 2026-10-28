import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { flattenFieldPaths } from '../src/invokers/fieldPaths.ts'
import { parseInvoker } from '../src/invokers/parseInvoker.ts'
import { buildInvokerXml } from '../src/invokerDraft/buildInvokerXml.ts'
import type { InvokerDraft } from '../src/invokerDraft/invokerDraft.schema.ts'
import { openApiToDraft, parseOpenApi } from '../src/invokerDraft/openApiToDraft.ts'

const draft: InvokerDraft = {
    name: 'Helpdesk & Co',
    description: 'Tickets <and> users',
    hint: '',
    category: 'Ticketsystem',
    auth: { kind: 'apikeyHeader', keyName: 'X-Api-Key' },
    baseUrl: 'https://{instance}.helpdesk.test/api',
    operations: [
        { name: 'ListTickets', method: 'GET', path: '/tickets', summary: '', group: 'tickets', request: null,
            response: { status: '200', type: 'array', fields: [
                { name: 'id', type: 'number', children: [] },
                { name: 'owner', type: 'object', children: [{ name: 'email', type: 'string', children: [] }] },
            ] } },
        { name: 'UpdateTicket', method: 'PUT', path: '/tickets/{id}/{apikey}', summary: '', group: 'tickets',
            request: { type: 'object', fields: [{ name: 'tags', type: 'array', children: [{ name: 'name', type: 'string', children: [] }] }] },
            response: { status: '200', type: 'object', fields: [] } },
    ],
    testOperation: 'ListTickets',
}

describe('buildInvokerXml', () => {
    const xml = buildInvokerXml(draft)
    const invoker = parseInvoker(xml)

    it('round-trips through the invoker parser with nested fields and workflow params intact', () => {
        expect(invoker.name).toBe('Helpdesk & Co')
        expect(invoker.requiredData).toEqual(['url', 'apikey'])
        expect(invoker.operations.map((op) => op.name)).toEqual(['ListTickets', 'UpdateTicket'])
        const [list, update] = invoker.operations
        expect(flattenFieldPaths(list!.responseFields).map((field) => field.path)).toEqual(['id', 'owner', 'owner.email'])
        expect(flattenFieldPaths(update!.requestFields).map((field) => field.path)).toEqual(['tags[]', 'tags[].name'])
        // A placeholder named like a connector setting would be filled from the connector; it is renamed.
        expect(update!.endpointParams).toEqual(['id', 'apikeyParam'])
    })

    it('adds a separate test operation, so the chosen call stays usable in workflows', () => {
        expect(xml).toContain('<operation name="TestConnection" type="test">')
        expect(xml).toContain('<operation name="ListTickets" type="">')
    })

    it('puts the API key where the docs say and keeps the base URL as the default url', () => {
        expect(xml).toContain('<item name="X-Api-Key" type="string">{apikey}</item>')
        expect(xml).toContain('<item name="url" type="string" visibility="public">https://{instance}.helpdesk.test/api</item>')
        expect(buildInvokerXml({ ...draft, auth: { kind: 'apikeyQuery', keyName: 'key' } })).toContain('<endpoint>{url}/tickets?key={apikey}</endpoint>')
        expect(buildInvokerXml({ ...draft, auth: { kind: 'basic', keyName: '' } })).toContain('>Basic {username:password}</item>')
    })
})

const openApi = `
openapi: 3.0.3
info: { title: Pet Shop, version: "2.1", description: Sells pets }
servers: [{ url: "https://shop.test/v2/" }]
components:
  securitySchemes:
    token: { type: http, scheme: bearer }
  schemas:
    Category:
      type: object
      properties:
        name: { type: string }
        parent: { $ref: "#/components/schemas/Category" }
    Pet:
      allOf:
        - type: object
          properties: { id: { type: integer } }
        - type: object
          properties:
            name: { type: string }
            category: { $ref: "#/components/schemas/Category" }
            tags: { type: array, items: { type: object, properties: { label: { type: string } } } }
paths:
  /pets:
    get:
      operationId: listPets
      tags: [pets]
      parameters: [{ name: status, in: query, required: true }, { name: limit, in: query }]
      responses:
        "200": { content: { application/json: { schema: { type: array, items: { $ref: "#/components/schemas/Pet" } } } } }
    post:
      requestBody: { content: { application/json: { schema: { $ref: "#/components/schemas/Pet" } } } }
      responses: { "201": { content: { application/json: { schema: { $ref: "#/components/schemas/Pet" } } } } }
  /health:
    get: { operationId: getHealth, responses: { "200": { description: ok } } }
  /pets/{petId}:
    delete:
      responses: { "204": { description: deleted } }
`

describe('openApiToDraft', () => {
    const spec = parseOpenApi(openApi)
    const converted = spec && openApiToDraft(spec)

    it('reads YAML and JSON specs and nothing else', () => {
        expect(spec).toBeDefined()
        expect(parseOpenApi(JSON.stringify({ swagger: '2.0', paths: {} }))).toBeDefined()
        expect(openApiToDraft({ openapi: '3.0.0', servers: [{ url: '/api/v3' }], paths: {} }).baseUrl).toBe('https://{host}/api/v3')
        expect(parseOpenApi('Our API lets you list tickets.')).toBeUndefined()
    })

    it('takes title, server, authentication and a parameterless read as the connection test', () => {
        expect(converted).toMatchObject({ name: 'Pet Shop', description: 'Sells pets', baseUrl: 'https://shop.test/v2',
            auth: { kind: 'bearer' }, testOperation: 'getHealth' })
    })

    it('names operations, keeps required query parameters as placeholders and resolves $ref, allOf and cycles', () => {
        expect(converted?.operations.map((op) => `${op.method} ${op.name} ${op.path}`)).toEqual([
            'GET listPets /pets?status={status}', 'POST postPets /pets', 'GET getHealth /health', 'DELETE deletePetsByPetId /pets/{petId}',
        ])
        const [list, create] = converted!.operations
        expect(list!.response.type).toBe('array')
        expect(list!.response.fields.map((field) => field.name)).toEqual(['id', 'name', 'category', 'tags'])
        const category = list!.response.fields.find((field) => field.name === 'category')
        expect(category?.children.map((field) => field.name)).toEqual(['name', 'parent'])
        // The recursive parent stops instead of nesting forever.
        expect(category?.children.find((field) => field.name === 'parent')?.children).toEqual([])
        expect(create!.request?.fields.find((field) => field.name === 'tags')?.children).toEqual([{ name: 'label', type: 'string', children: [] }])
        expect(create!.response.status).toBe('201')
    })

    it('builds an invoker the parser accepts', () => {
        const invoker = parseInvoker(buildInvokerXml(converted!))
        expect(invoker.operations.find((op) => op.name === 'listPets')?.endpointParams).toEqual(['status'])
    })
})

describe('invoker draft routes', () => {
    const modelDraft = {
        name: 'Ignored', description: 'Help desk', hint: '', category: 'Ticketsystem',
        auth: { kind: 'bearer', keyName: '' }, baseUrl: 'https://{instance}.desk.test/api/v1',
        operations: [
            { name: 'GetTickets', method: 'GET', path: 'https://acme.desk.test/api/v1/tickets', summary: '', group: '', request: null,
                response: { status: '200', type: 'array', fields: [{ name: 'id', type: 'number', children: [] }] } },
            { name: 'GetTickets', method: 'GET', path: 'tickets/{id}', summary: '', group: '', request: null,
                response: { status: '200', type: 'object', fields: [] } },
        ],
        testOperation: 'GetTicketById',
    }
    const appWith = async (answer: object) => {
        const requests: ChatRequest[] = []
        const llm: LlmClient = {
            async chat(request) {
                requests.push(request)
                return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 3 }
            },
            async listModels() { return [] },
        }
        const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
        return { app: await buildApp({ config: loadConfig({}), llm, invokers }), requests }
    }

    it('converts an OpenAPI spec without asking the model', async () => {
        const { app, requests } = await appWith({})
        const response = await app.inject({ method: 'POST', url: '/invoker/draft', payload: { docs: openApi, name: 'Pets' } })
        expect(response.json()).toMatchObject({ source: 'openapi', draft: { name: 'Pets', testOperation: 'getHealth' } })
        expect(requests).toHaveLength(0)
    })

    it('asks the model for other docs, then tidies paths, names and the test operation', async () => {
        const { app, requests } = await appWith(modelDraft)
        const response = await app.inject({ method: 'POST', url: '/invoker/draft',
            payload: { docs: '<html><body><h1>Desk API</h1><script>x()</script><p>GET /tickets lists tickets</p></body></html>', name: 'Desk' } })
        const { draft, source } = response.json()
        expect(source).toBe('ai')
        expect(draft.name).toBe('Desk')
        expect(draft.operations.map((op: { name: string; path: string }) => `${op.name} ${op.path}`)).toEqual(['GetTickets /tickets', 'GetTickets2 /tickets/{id}'])
        expect(draft.testOperation).toBe('GetTickets')
        const told = requests[0]?.messages[1]?.content ?? ''
        expect(told).toContain('GET /tickets lists tickets')
        expect(told).not.toContain('x()')
    })

    it('turns a reviewed draft into XML and rejects a malformed one', async () => {
        const { app } = await appWith({})
        const ok = await app.inject({ method: 'POST', url: '/invoker/xml', payload: { draft } })
        expect(parseInvoker(ok.json().xml).operations).toHaveLength(2)
        const bad = await app.inject({ method: 'POST', url: '/invoker/xml', payload: { draft: { ...draft, operations: [] } } })
        expect(bad.statusCode).toBe(400)
    })
})
