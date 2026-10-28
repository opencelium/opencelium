import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { parseOperationUsages } from '../src/examples/operationUsage.ts'
import { type OperationUsages, createOperationUsages, describeOperationExamples } from '../src/examples/operationUsages.ts'
import type { Invoker } from '../src/invokers/invoker.types.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { helpdesk, tracker } from './fixtures.ts'

const method = (name: string, index: string, color: string, request: object = {}) => ({ name, index, color, request })

const template = (name: string, ticket: object) => ({
    name,
    connection: {
        fromConnector: { invoker: { name: 'Tracker' }, operators: [], methods: [method('ListIssues', '0', '#A')] },
        toConnector: {
            invoker: { name: 'Helpdesk' },
            operators: [{ index: '1', type: 'loop', condition: { leftStatement: { color: '#A', field: 'success.issues[]' } } }],
            methods: [method('CreateTicket', '1_0', '#C', ticket)],
        },
        fieldBinding: [{ from: [{ color: '#A', field: 'success.issues[i].fields.summary' }], to: [{ color: '#C', field: 'title' }],
            enhancement: { expertCode: 'RESULT_VAR = VAR_0;' } }],
    },
})

const urgent = template('Urgent tickets', {
    endpoint: '{url}/tickets?queue={%#A.(response).success.issues[i].key%}',
    body: { fields: { state: 'urgent', apikey: '{apikey}', article: { body: '#A.(response).success.issues[i].fields.summary' } } },
})
const plain = template('Plain tickets', { endpoint: '{url}/tickets', body: { fields: { state: 'new' } } })

describe('parseOperationUsages', () => {
    const usages = parseOperationUsages(urgent)
    const create = usages.find((usage) => usage.operation === 'CreateTicket')

    it('records each call with its systems, enclosing loop, endpoint, fixed values and field sources', () => {
        expect(create).toEqual({
            templateId: '', template: 'Urgent tickets', system: 'Helpdesk', counterpart: 'Tracker', operation: 'CreateTicket',
            context: ['for each item of ListIssues issues'],
            endpoint: '/tickets?queue=ListIssues issues.key',
            fields: ['title = item ListIssues issues.fields.summary', 'state = "urgent"', 'article.body = item ListIssues issues.fields.summary'],
        })
    })

    it('leaves out a bare endpoint, which says nothing the invoker does not', () => {
        expect(parseOperationUsages(plain).find((usage) => usage.operation === 'CreateTicket')?.endpoint).toBe('')
    })
})

function templateDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ai-operation-usages-'))
    writeFileSync(join(dir, 'urgent.json'), JSON.stringify(urgent))
    writeFileSync(join(dir, 'plain.json'), JSON.stringify(plain))
    // Calls an operation the installed Helpdesk no longer has.
    writeFileSync(join(dir, 'stale.json'), JSON.stringify(template('Stale', {})).replaceAll('CreateTicket', 'OpenTicket'))
    writeFileSync(join(dir, 'broken.json'), '{ not json')
    return dir
}

const invokers: InvokerRepository = {
    list: async () => [],
    get: async (name) => [tracker, helpdesk].find((invoker) => invoker.name.toLowerCase() === name.toLowerCase()),
}

const call = (text: string, invoker: Invoker = helpdesk, operation = 'CreateTicket') =>
    ({ side: 'to' as const, invoker, operation, counterpart: tracker, text })

describe('createOperationUsages', () => {
    it('finds the calls of an operation on its installed system, the one sharing the plan words first', async () => {
        const usages = createOperationUsages(templateDir(), invokers)
        const [found] = await usages.find([call('create an urgent ticket')], 2)
        expect(found?.operation).toBe('CreateTicket')
        expect(found?.usages.map((usage) => usage.template)).toEqual(['Urgent tickets', 'Plain tickets'])
        const [other] = await usages.find([call('create a new ticket')], 1)
        expect(other?.usages.map((usage) => usage.template)).toEqual(['Plain tickets'])
    })

    it('ignores calls of operations the installed invoker does not have, and operations no template calls', async () => {
        const usages = createOperationUsages(templateDir(), invokers)
        expect(await usages.find([call('open', helpdesk, 'OpenTicket')], 2)).toEqual([])
    })

    it('describes each operation with its template calls', async () => {
        const [found] = await createOperationUsages(templateDir(), invokers).find([call('urgent')], 1)
        const text = describeOperationExamples(found ? [found] : [])
        expect(text).toContain('CreateTicket (Helpdesk):')
        expect(text).toContain('in template "Urgent tickets" (Helpdesk <-> Tracker), inside: for each item of ListIssues issues')
        expect(text).toContain('state = "urgent"')
        expect(describeOperationExamples([])).toBe('')
    })
})

describe('operation usages in the build route', () => {
    const plan = `- Read the issues with ListIssues.
- For each issue (loop over the ListIssues result): create it with CreateTicket.`
    const usages: OperationUsages & { calls: string[] } = {
        calls: [],
        async find(calls) {
            usages.calls.push(...calls.map((entry) => entry.operation))
            const [usage] = parseOperationUsages(urgent).filter((entry) => entry.operation === 'CreateTicket')
            return usage ? [{ operation: 'CreateTicket', system: 'Helpdesk', usages: [usage] }] : []
        },
        async warmUp() {},
    }
    const build = async (useTemplates: boolean) => {
        const requests: ChatRequest[] = []
        const llm: LlmClient = {
            async chat(request) {
                requests.push(request)
                return { content: '{}', promptTokens: 1, outputTokens: 1, durationMs: 1 }
            },
            async listModels() { return [] },
        }
        usages.calls = []
        const app = await buildApp({ config: { ...loadConfig({}), maxRepairAttempts: 0 }, llm, invokers, operationUsages: usages })
        const response = await app.inject({ method: 'POST', url: '/workflow/generate',
            payload: { prompt: 'Tickets for issues', from: 'Tracker', to: 'Helpdesk', plan, useTemplates } })
        return { told: requests.map((request) => request.messages.map((message) => message.content).join('\n')).join('\n'), response }
    }

    it('looks up every operation of the plan and shows its template calls', async () => {
        const { told } = await build(true)
        expect(usages.calls).toEqual(['ListIssues', 'CreateTicket'])
        expect(told).toContain('How these operations are called in this installation')
        expect(told).toContain('state = "urgent"')
    })

    it('leaves them out when templates are switched off', async () => {
        const { told } = await build(false)
        expect(usages.calls).toEqual([])
        expect(told).not.toContain('How these operations are called')
    })
})
