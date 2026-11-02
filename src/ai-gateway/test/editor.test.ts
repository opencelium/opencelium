import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { Invoker } from '../src/invokers/invoker.types.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { bestByWords, sharedWords, withoutWords } from '../src/editor/operationWords.ts'

const operation = (name: string) => ({ name, httpMethod: 'GET', endpoint: `/${name}`, endpointParams: [], requestFields: [], responseFields: [] })
const crm: Invoker = {
    name: 'CRM', description: '', requiredData: [],
    operations: ['getAllUsers', 'getUserById', 'createUser', 'deleteUser', 'getCustomers'].map(operation),
}
const invokers: InvokerRepository = {
    list: async () => [{ name: 'CRM', description: '', operationCount: crm.operations.length }],
    get: async (name) => (name.toLowerCase() === 'crm' ? crm : undefined),
}

/** Answers each chat in turn, so a test scripts the read and, if asked, the pick. */
function llmAnswering(...answers: object[]): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            return { content: JSON.stringify(answers[requests.length - 1]), promptTokens: 1, outputTokens: 1, durationMs: 10 }
        },
        async listModels() { return [] },
    }
}

const connectors = [{ id: '7', title: 'CRM production', invoker: 'CRM' }, { id: '9', title: 'Ticketing', invoker: 'OTRS' }]
const steps = [{ id: 'n1', label: 'getCustomers' }, { id: 'n2', label: 'createClient' }]

async function route(prompt: string, ...answers: object[]) {
    const llm = llmAnswering(...answers)
    const app = await buildApp({ config: loadConfig({}), llm, invokers })
    const response = await app.inject({ method: 'POST', url: '/workflow/add-method/intent', payload: { prompt, connectors, steps } })
    return { response, body: response.json(), llm }
}

describe('POST /workflow/add-method/intent', () => {
    it('takes a spelled-out operation without a second question', async () => {
        const { response, body, llm } = await route('add get all users from CRM production before create client',
            { connector: 'c1', method: 'get all users', position: 'before', step: 's2' })
        expect(response.statusCode).toBe(200)
        expect(body).toMatchObject({ connectorId: '7', operation: 'getAllUsers', position: 'before', stepId: 'n2' })
        expect(llm.requests).toHaveLength(1)
        // Connectors and steps go to the model as short keys it can only choose from.
        expect(JSON.stringify(llm.requests[0]?.format)).toContain('"none","c1","c2"')
    })

    it('asks the model to pick an operation for a looser description', async () => {
        // Two operations share both words ("get", "user"): the words cannot decide, the model does.
        const { body, llm } = await route('add the call that fetches a user from the CRM',
            { connector: 'c1', method: 'fetch a user', position: 'after', step: '' },
            { operation: 'getUserById' })
        expect(body).toMatchObject({ connectorId: '7', operation: 'getUserById', position: 'after', stepId: null })
        expect(JSON.stringify(llm.requests[1]?.format)).toContain('getAllUsers')
    })

    it('reports an operation the connector does not have', async () => {
        const { body } = await route('add send fax from CRM production',
            { connector: 'c1', method: 'send fax', position: 'after', step: '' },
            { operation: 'none' })
        expect(body).toMatchObject({ connectorId: '7', operation: null, spokenMethod: 'send fax' })
    })

    it('reports a connector the user does not have', async () => {
        const { body, llm } = await route('add get users from Salesforce',
            { connector: 'none', method: 'get users', position: 'after', step: '' })
        expect(body).toMatchObject({ connectorId: null, operation: null })
        expect(llm.requests).toHaveLength(1)
    })

    it('drops a step the request does not mention', async () => {
        const { body } = await route('add get all users from CRM production',
            { connector: 'c1', method: 'get all users', position: 'after', step: 's1' })
        expect(body.stepId).toBeNull()
    })

    it('rejects a request without connectors', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering(), invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/add-method/intent', payload: { prompt: 'add x', connectors: [] } })
        expect(response.statusCode).toBe(400)
    })
})

describe('operation words', () => {
    const idoit = ['cmdb.objects.read', 'cmdb.object.read', 'cmdb.object.delete', 'cmdb.category.delete', 'idoit.version']

    it('bridges a German description to the operation it names', () => {
        expect(bestByWords('Löschen eines Objekts', idoit)).toBe('cmdb.object.delete')
    })

    it('leaves a tie to the model', () => {
        expect(bestByWords('reads all objects', idoit)).toBe('')
    })

    it('finds no shared word for something the connector cannot do', () => {
        expect(sharedWords('send fax', 'ServiceCreate')).toBe(0)
        expect(sharedWords('searches services', 'ServiceSearch')).toBe(2)
    })

    it('drops the new method\'s words before looking for the step, once each', () => {
        expect(withoutWords('add a method from i-doit that reads all objects', 'read all objects')).toBe('add a method from i-doit that')
        expect(withoutWords('add config item update after config item get', 'config item update')).toBe('add after config item get')
    })
})

describe('POST /workflow/mapping/intent', () => {
    const methods = ['ConfigItemSearch', 'ConfigItemGet', 'ConfigItemCreate', 'TicketCreate', 'createClient']

    async function read(prompt: string, answer: object) {
        const llm = llmAnswering(answer)
        const app = await buildApp({ config: loadConfig({}), llm, invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/mapping/intent', payload: { prompt, methods } })
        return { response, body: response.json(), llm }
    }

    it('reads the target and the source from the workflow\'s own methods', async () => {
        const { response, body, llm } = await read('suggest references for ConfigItemCreate from config item get', { target: 'm3', source: 'm2' })
        expect(response.statusCode).toBe(200)
        expect(body).toMatchObject({ target: 'ConfigItemCreate', source: 'ConfigItemGet' })
        expect(JSON.stringify(llm.requests[0]?.format)).toContain('"","m1","m2"')
    })

    it('leaves out a method named only through the other one\'s words', async () => {
        const { body } = await read('suggest references for this method from config item search', { target: 'm3', source: 'm1' })
        expect(body).toMatchObject({ target: '', source: 'ConfigItemSearch' })
        const { body: other } = await read('suggest a mapping for ticket create', { target: 'm4', source: 'm5' })
        expect(other).toMatchObject({ target: 'TicketCreate', source: '' })
    })

    it('takes a spelled-out name over a close one the model chose', async () => {
        const { body } = await read('suggest references for config item create method from config item get method', { target: 'm1', source: 'm2' })
        expect(body).toMatchObject({ target: 'ConfigItemCreate', source: 'ConfigItemGet' })
    })

    it('rejects a request without methods', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering(), invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/mapping/intent', payload: { prompt: 'x', methods: [] } })
        expect(response.statusCode).toBe(400)
    })
})

describe('POST /workflow/transformation/intent', () => {
    const fields = ['ConfigItem.Number', 'ConfigItem.Name', 'ConfigItem.CIXMLData.Vendor', 'ConfigItem.CIXMLData.SerialNumber', '@odata.id', 'id']

    async function read(prompt: string, answer: object) {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering(answer), invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/transformation/intent', payload: { prompt, fields } })
        return { response, body: response.json() }
    }

    it('reads the field and what the script should do', async () => {
        const { response, body } = await read('apply transformation for vendor with upper case', { field: 'f3', spokenField: 'x', description: 'upper case' })
        expect(response.statusCode).toBe(200)
        expect(body).toMatchObject({ field: 'ConfigItem.CIXMLData.Vendor', description: 'upper case' })
    })

    it('takes a spelled-out field over the model\'s pick, a German compound too', async () => {
        const { body } = await read('transform the config item name: first 50 characters', { field: 'f1', spokenField: 'x', description: 'first 50 characters' })
        expect(body.field).toBe('ConfigItem.Name')
        const { body: german } = await read('Transformation für die Seriennummer: Leerzeichen entfernen', { field: '', spokenField: 'x', description: 'Leerzeichen entfernen' })
        expect(german.field).toBe('ConfigItem.CIXMLData.SerialNumber')
    })

    it('leaves the field empty when the request names none of them', async () => {
        const { body } = await read('apply transformation for the price with round it', { field: 'f1', spokenField: 'x', description: 'round it' })
        expect(body.field).toBe('')
    })

    it('finds a short name only as a word of its own', async () => {
        const { body } = await read('apply transformation for id property with convert it to a number', { field: '', spokenField: 'id', description: 'convert it to a number' })
        expect(body.field).toBe('id')
        const { body: dotted } = await read('apply transformation for the odata id with prefix it', { field: '', spokenField: 'odata id', description: 'prefix it' })
        expect(dotted.field).toBe('@odata.id')
    })

    it('tells a field named but not there from none named, which means the selected one', async () => {
        const { body } = await read('apply transformation for the price with round it', { field: '', spokenField: 'price', description: 'round it' })
        expect(body).toMatchObject({ field: '', spokenField: 'price' })
        const { body: selected } = await read('apply transformation for this property with upper case', { field: '', spokenField: 'this property', description: 'upper case' })
        expect(selected).toMatchObject({ field: '', spokenField: '' })
    })

    it('rejects a request without fields', async () => {
        const app = await buildApp({ config: loadConfig({}), llm: llmAnswering(), invokers })
        const response = await app.inject({ method: 'POST', url: '/workflow/transformation/intent', payload: { prompt: 'x', fields: [] } })
        expect(response.statusCode).toBe(400)
    })
})
