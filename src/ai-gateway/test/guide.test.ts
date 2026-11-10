import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { findSpokenMethod } from '../src/guide/spokenNames.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }

const guides = [
    { id: 'method-headers', description: 'Where the request headers of a method are' },
    { id: 'method-body', description: 'Where the request body of a method is' },
]
const methods = ['getCustomers', 'getCustomersById', 'createClient', 'getCustomers']

function llmAnswering(answer: object): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            return { content: JSON.stringify(answer), promptTokens: 1, outputTokens: 1, durationMs: 10 }
        },
        async listModels() { return [] },
    }
}

async function route(prompt: string, answer: object, extra: object = {}) {
    const llm = llmAnswering(answer)
    const app = await buildApp({ config: loadConfig({}), llm, invokers })
    const response = await app.inject({ method: 'POST', url: '/guide/intent', payload: { prompt, guides, methods, ...extra } })
    return { response, body: response.json(), llm }
}

describe('findSpokenMethod', () => {
    it('finds a method spoken as separate words', () => {
        expect(findSpokenMethod('where are the headers of get customers', methods)).toBe('getCustomers')
    })

    it('prefers the longest name the request spells out', () => {
        expect(findSpokenMethod('show the body of get customers by id', methods)).toBe('getCustomersById')
    })

    it('forgives a slipped letter in a long name', () => {
        expect(findSpokenMethod('Beebot, wo ist der Body von ConfigItemGit?', ['ConfigItemGet', 'ConfigItemSearch', 'getCustomers'])).toBe('ConfigItemGet')
        expect(findSpokenMethod('headers of get costumers', methods)).toBe('getCustomers')
    })

    it('does not stretch a short name to a different word', () => {
        expect(findSpokenMethod('where is the body', ['body2', 'getBody'])).toBe('')
    })

    it('finds nothing when no method is named', () => {
        expect(findSpokenMethod('wo ist der Header der Methode?', methods)).toBe('')
    })
})

describe('POST /guide/intent', () => {
    it('answers with the guide and the named method', async () => {
        const { response, body, llm } = await route('where are the headers of getCustomers?', { guide: 'method-headers', method: 'getCustomers' })
        expect(response.statusCode).toBe(200)
        expect(body).toMatchObject({ guideId: 'method-headers', method: 'getCustomers' })
        // The answer is constrained to the request's own guides and (deduplicated) methods.
        const format = JSON.stringify(llm.requests[0]?.format)
        expect(format).toContain('"none","method-headers","method-body"')
        expect(format).toContain('"","getCustomers","getCustomersById","createClient"]')
    })

    it('keeps a method out when the request names none, whatever the model picked', async () => {
        const { body } = await route('wo ist der Header der Methode?', { guide: 'method-headers', method: 'getCustomers' })
        expect(body).toMatchObject({ guideId: 'method-headers', method: '' })
    })

    it('takes a method the model matched from a partial name', async () => {
        const { body } = await route('show me the body of the client creation', { guide: 'method-body', method: 'createClient' })
        expect(body.method).toBe('createClient')
    })

    it('never runs an action for a question about how to do it', async () => {
        const options = [...guides, { id: 'add-method', description: 'Add a method', isAction: true }]
        let result = await route('how do I add a new method?', { guide: 'add-method', method: '' }, { guides: options })
        expect(result.body.guideId).toBeNull()
        result = await route('can you add getCustomers from the CRM', { guide: 'add-method', method: '' }, { guides: options })
        expect(result.body.guideId).toBe('add-method')
    })

    it('turns an action read into a how-question into the guide teaching it, and back', async () => {
        const options = [
            { id: 'method-transformation', description: 'show how to apply a transformation', teaches: 'apply-transformation' },
            { id: 'apply-transformation', description: 'apply a transformation', isAction: true },
        ]
        let result = await route('how do I apply a transformation?', { guide: 'apply-transformation', method: '' }, { guides: options })
        expect(result.body.guideId).toBe('method-transformation')
        result = await route('transform the vendor so it is upper case', { guide: 'method-transformation', method: '' }, { guides: options })
        expect(result.body.guideId).toBe('apply-transformation')
        result = await route('show me how to transform a value', { guide: 'method-transformation', method: '' }, { guides: options })
        expect(result.body.guideId).toBe('method-transformation')
    })

    it('opens a part on an instruction and shows where it is when asked to be shown', async () => {
        const options = [
            { id: 'method-body', description: 'show where the body is', teaches: 'open-body' },
            { id: 'open-body', description: 'open the body', isAction: true },
        ]
        const methods = { guides: options, methods: ['getCustomers'] }
        let result = await route('getCustomers body', { guide: 'method-body', method: 'getCustomers' }, methods)
        expect(result.body).toMatchObject({ guideId: 'open-body', method: 'getCustomers' })
        result = await route('zeig mir den Body von getCustomers', { guide: 'open-body', method: 'getCustomers' }, methods)
        expect(result.body.guideId).toBe('method-body')
        result = await route('where is the body of getCustomers', { guide: 'open-body', method: 'getCustomers' }, methods)
        expect(result.body.guideId).toBe('method-body')
        result = await route('open the body of getCustomers', { guide: 'open-body', method: 'getCustomers' }, methods)
        expect(result.body.guideId).toBe('open-body')
    })

    it('reads an option about the whole workflow as its per-method one when a method is named', async () => {
        const options = [
            { id: 'method-try', description: 'show how to try a method' },
            { id: 'test-workflow', description: 'test the whole workflow', isAction: true, withMethod: 'method-try' },
        ]
        let result = await route('test the workflow', { guide: 'test-workflow', method: '' }, { guides: options })
        expect(result.body.guideId).toBe('test-workflow')
        result = await route('send a test request for create client', { guide: 'test-workflow', method: 'createClient' }, { guides: options })
        expect(result.body).toMatchObject({ guideId: 'method-try', method: 'createClient' })
        result = await route('how can I test the getCustomers request', { guide: 'test-workflow', method: 'getCustomers' }, { guides: options })
        expect(result.body.guideId).toBe('method-try')
    })

    it('answers no guide when none fits', async () => {
        const { body } = await route('order a pizza', { guide: 'none', method: '' })
        expect(body).toMatchObject({ guideId: null, method: '' })
    })

    it('works for a workflow without methods', async () => {
        const { body } = await route('where is the body', { guide: 'method-body', method: '' }, { methods: [] })
        expect(body).toMatchObject({ guideId: 'method-body', method: '' })
    })

    it('rejects a request without guides', async () => {
        const { response } = await route('where is the body', { guide: 'none', method: '' }, { guides: [] })
        expect(response.statusCode).toBe(400)
    })
})
