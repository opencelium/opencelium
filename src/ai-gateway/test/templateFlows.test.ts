import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { parseTemplateFlow } from '../src/examples/templateFlow.ts'
import { type TemplateFlows, createTemplateFlows, describeTemplateExamples } from '../src/examples/templateFlows.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import type { Embedder } from '../src/llm/ollamaEmbedder.ts'
import { connectors, helpdesk, tracker } from './fixtures.ts'

const method = (name: string, index: string, color: string, fields: unknown = null) =>
    ({ name, index, color, request: { body: fields === null ? null : { fields } } })

/** Tracker issues become Helpdesk tickets unless a ticket with the summary as title exists. */
const ticketTemplate = {
    name: 'Issues to tickets',
    description: 'Creates a ticket for every new issue',
    connection: {
        fromConnector: {
            invoker: { name: 'Tracker' },
            methods: [method('ListIssues', '0', '#A', { jql: 'status = Open', apikey: '{apikey}' })],
            operators: [],
        },
        toConnector: {
            invoker: { name: 'Helpdesk' },
            methods: [
                method('SearchTickets', '0', '#B'),
                method('CreateTicket', '1_0_0', '#C', { title: '#A.(response).success.issues[i].fields.summary', state: 'new' }),
            ],
            operators: [
                { index: '1', type: 'loop', condition: { leftStatement: { color: '#A', field: 'success.issues[]' }, relationalOperator: '' } },
                { index: '1_0', type: 'if', condition: {
                    leftStatement: { color: '#B', field: 'success.tickets[]' }, relationalOperator: 'NotContains',
                    rightStatement: { color: '#A', field: 'success.issues[i].fields.summary', rightPropertyValue: 'title' },
                } },
            ],
        },
        fieldBinding: [
            { from: [{ color: '#A', field: 'success.issues[i].fields.summary' }], to: [{ color: '#C', field: 'title' }],
                enhancement: { expertCode: 'RESULT_VAR = VAR_0;' } },
            { from: [{ color: '#A', field: 'success.issues[i].fields.priority.name' }], to: [{ color: '#C', field: 'priority' }],
                enhancement: { expertCode: "RESULT_VAR = VAR_0 == 'High' ? 1 : 3;" } },
        ],
    },
}

describe('parseTemplateFlow', () => {
    const flow = parseTemplateFlow('t1', ticketTemplate)

    it('reads the calls and operators of both connectors in tree order, nested by their index', () => {
        expect(flow?.steps.map((step) => `${'  '.repeat(step.depth)}${step.text}`)).toEqual([
            'Call ListIssues (Tracker) with jql "status = Open".',
            'Call SearchTickets (Helpdesk).',
            'For each item of ListIssues issues:',
            '  If SearchTickets tickets.title does not contain ListIssues issues.fields.summary:',
            '    Call CreateTicket (Helpdesk) with state "new".',
        ])
        expect(flow?.operations).toEqual({ from: ['ListIssues'], to: ['SearchTickets', 'CreateTicket'] })
    })

    it('keeps the fields out of the steps, as rule lines that tell copies from scripts', () => {
        expect(flow?.fieldRules).toEqual([
            'CreateTicket set title = item ListIssues issues.fields.summary; priority = script: computed from ListIssues issues.fields.priority.name',
        ])
    })

    it('skips files without a workflow', () => {
        expect(parseTemplateFlow('empty', { name: 'x', connection: { fromConnector: { methods: [] } } })).toBeUndefined()
    })
})

describe('describeTemplateExamples', () => {
    const flow = parseTemplateFlow('t1', ticketTemplate)!

    it('shows a plan the steps only, and a build the fields too', () => {
        expect(describeTemplateExamples([flow], 'plan', connectors)).not.toContain('priority = script')
        expect(describeTemplateExamples([flow], 'build', connectors)).toContain('priority = script')
        expect(describeTemplateExamples([], 'plan', connectors)).toBe('')
    })

    it('marks the calls the request systems do not offer', () => {
        const text = describeTemplateExamples([flow], 'plan', connectors)
        expect(text).toContain('Call SearchTickets (Helpdesk). [not available]')
        expect(text).toContain('Call ListIssues (Tracker) with jql "status = Open".\n')
    })
})

/** Vectors by keyword: "ticket" texts point one way, "invoice" texts another. */
const embedder: Embedder = {
    async embed(texts) {
        return texts.map((text) => [/ticket/i.test(text) ? 1 : 0, /invoice/i.test(text) ? 1 : 0, 0.01])
    },
}

function templateDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ai-template-flows-'))
    writeFileSync(join(dir, 'tickets.json'), JSON.stringify({ templateId: 'tickets', ...ticketTemplate }))
    const reversed = { ...ticketTemplate, name: 'Tickets back to issues', connection: {
        ...ticketTemplate.connection, fromConnector: ticketTemplate.connection.toConnector, toConnector: ticketTemplate.connection.fromConnector,
    } }
    writeFileSync(join(dir, 'reversed.json'), JSON.stringify(reversed))
    writeFileSync(join(dir, 'invoices.json'), JSON.stringify({ ...ticketTemplate, name: 'Invoices', description: 'Books every invoice' }))
    writeFileSync(join(dir, 'broken.json'), '{ not json')
    return dir
}

describe('createTemplateFlows', () => {
    it('ranks the template on the same systems in the same direction first and drops unrelated ones', async () => {
        const found = await createTemplateFlows(templateDir(), embedder).find('Open a ticket per issue', connectors, 5)
        expect(found.map((flow) => flow.name)).toEqual(['Issues to tickets', 'Tickets back to issues'])
    })

    it('offers no examples when embedding fails', async () => {
        const failing: Embedder = { embed: async () => { throw new Error('no model') } }
        const flows = createTemplateFlows(templateDir(), failing)
        await flows.warmUp()
        expect(await flows.find('Open a ticket per issue', connectors, 2)).toEqual([])
    })
})

describe('templates in the workflow routes', () => {
    const invokers: InvokerRepository = {
        list: async () => [],
        get: async (name) => [tracker, helpdesk].find((invoker) => invoker.name.toLowerCase() === name.toLowerCase()),
    }
    const flow = parseTemplateFlow('t1', ticketTemplate)!
    const templates: TemplateFlows & { calls: number } = {
        calls: 0,
        async find() {
            templates.calls++
            return [flow]
        },
        async warmUp() {},
    }
    const plan = JSON.stringify({ pattern: 'custom', fieldRules: [], steps: [{ text: 'Read issues with ListIssues', depth: 0 }] })
    const planningLlm = (): LlmClient & { requests: ChatRequest[] } => {
        const requests: ChatRequest[] = []
        return {
            requests,
            async chat(request) {
                requests.push(request)
                return { content: plan, promptTokens: 1, outputTokens: 1, durationMs: 1 }
            },
            async listModels() { return [] },
        }
    }
    const planWith = async (useTemplates?: boolean) => {
        const llm = planningLlm()
        templates.calls = 0
        const app = await buildApp({ config: loadConfig({}), llm, invokers, templates })
        const response = await app.inject({ method: 'POST', url: '/workflow/plan',
            payload: { prompt: 'Ticket per issue', from: 'Tracker', to: 'Helpdesk', ...(useTemplates === undefined ? {} : { useTemplates }) } })
        return { body: response.json(), system: llm.requests[0]?.messages[0]?.content ?? '' }
    }

    it('plans with the closest templates and names them in the answer', async () => {
        const { body, system } = await planWith(undefined)
        expect(system).toContain('Template "Issues to tickets"')
        expect(body.templates).toEqual([{ id: 't1', name: 'Issues to tickets' }])
    })

    it('leaves them out when the user switched templates off', async () => {
        const { body, system } = await planWith(false)
        expect(templates.calls).toBe(0)
        expect(system).not.toContain('Template "')
        expect(body.templates).toEqual([])
    })
})
