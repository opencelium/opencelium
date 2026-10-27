import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { toQuartzCron, type ScheduleTiming } from '../src/command/scheduleTiming.ts'
import { loadConfig } from '../src/config.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const timing = (overrides: Partial<ScheduleTiming>): ScheduleTiming =>
    ({ frequency: 'daily', every: 1, time: '', weekdays: [], dayOfMonth: 0, ...overrides })

describe('toQuartzCron', () => {
    it('writes the 6-field Quartz form the scheduler stores', () => {
        expect(toQuartzCron(timing({ frequency: 'minutes', every: 15 }))).toBe('0 0/15 * * * ?')
        expect(toQuartzCron(timing({ frequency: 'hourly', every: 2, time: '00:30' }))).toBe('0 30 0/2 * * ?')
        expect(toQuartzCron(timing({ frequency: 'daily', time: '06:00' }))).toBe('0 0 6 * * ?')
        expect(toQuartzCron(timing({ frequency: 'weekly', time: '18:15', weekdays: ['FRI', 'MON'] }))).toBe('0 15 18 ? * 2,6')
        expect(toQuartzCron(timing({ frequency: 'monthly', time: '7', dayOfMonth: 5 }))).toBe('0 0 7 5 * ?')
    })

    it('leaves the cron empty when no timing was said, rather than guessing', () => {
        expect(toQuartzCron(timing({ frequency: 'unknown' }))).toBe('')
        expect(toQuartzCron(timing({ time: '25:99' }))).toBe('0 0 0 * * ?')
    })
})

const commands = [
    { id: 'create schedule', phrase: 'create schedule', description: 'Create a new entry. Schedules (Zeitpläne)' },
    { id: 'create connector', phrase: 'create connector', description: 'Create a new entry. Connectors' },
    { id: 'list users', phrase: 'list users', description: 'Open the entry list' },
]
const invokers = { list: async () => [{ name: 'i-doit' }, { name: 'OTRS' }], get: async () => undefined } as unknown as InvokerRepository

function llmAnswering(answers: object[]): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        async chat(request) {
            requests.push(request)
            return { content: JSON.stringify(answers[requests.length - 1] ?? {}), promptTokens: 1, outputTokens: 1, durationMs: 5 }
        },
        async listModels() { return [] },
    }
}

const route = async (llm: LlmClient, prompt: string) => {
    const app = await buildApp({ config: loadConfig({}), llm, invokers })
    return (await app.inject({ method: 'POST', url: '/command/route', payload: { prompt, commands } })).json()
}

describe('create commands with values', () => {
    it('asks a second question for the schedule form and turns its timing into cron', async () => {
        const llm = llmAnswering([
            { action: 'create', command: 'c1', argument: '', reply: 'ok' },
            { workflow: 'idoit to OTRS', title: '', timing: { frequency: 'daily', every: 1, time: '06:00', weekdays: [], dayOfMonth: 0 } },
        ])
        const result = await route(llm, 'schedule the idoit to OTRS workflow every day at 6')
        expect(result.intent).toEqual({ kind: 'schedule', workflow: 'idoit to OTRS', title: '', cronExp: '0 0 6 * * ?' })
        expect(llm.requests[1]?.messages[0]?.content).toContain('Fill a new schedule')
    })

    it('limits a connector to installed systems and never invents one', async () => {
        const answers = (system: string) => [
            { action: 'create', command: 'c1', argument: '', reply: 'ok' },
            { system, title: 'CMDB', description: '' },
        ]
        let llm = llmAnswering(answers('i-doit'))
        let result = await route(llm, 'add a connector for i-doit called CMDB')
        expect(result.intent).toEqual({ kind: 'connector', system: 'i-doit', title: 'CMDB', description: '' })
        expect(llm.requests[1]?.messages[0]?.content).toContain('Systems: i-doit, OTRS')
        llm = llmAnswering(answers('SAP'))
        result = await route(llm, 'add a connector for SAP')
        expect(result.intent?.system).toBe('')
    })

    it('adds no values to other commands', async () => {
        const llm = llmAnswering([{ action: 'list', command: 'c1', argument: '', reply: 'ok' }])
        const app = await buildApp({ config: loadConfig({}), llm, invokers })
        const response = await app.inject({ method: 'POST', url: '/command/route', payload: { prompt: 'users', commands: [commands[2]] } })
        expect(response.json().intent).toBeNull()
        expect(llm.requests).toHaveLength(1)
    })
})
