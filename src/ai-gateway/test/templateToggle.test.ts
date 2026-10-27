import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { ScriptExamples } from '../src/examples/scriptExamples.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { helpdesk, tracker } from './fixtures.ts'

const invokers: InvokerRepository = {
    list: async () => [],
    get: async (name) => [tracker, helpdesk].find((invoker) => invoker.name.toLowerCase() === name.toLowerCase()),
}

const plan = `- Read the issues with ListIssues.
- For each issue (loop over the ListIssues result): create it with CreateTicket.
- CreateTicket set title = script: "URGENT " before the summary when the priority is High; article.body = item key.`

function recordingLlm(): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    return {
        requests,
        // Not a valid workflow: these tests only look at what the model was told.
        async chat(request) {
            requests.push(request)
            return { content: '{}', promptTokens: 1, outputTokens: 1, durationMs: 1 }
        },
        async listModels() { return [] },
    }
}

function countingExamples(): ScriptExamples & { calls: number } {
    const examples = {
        calls: 0,
        async find() {
            examples.calls++
            return [{ target: 'Ticket.Title', inputs: ['issue.summary'], code: 'RESULT_VAR = "TEMPLATE " + VAR_0;' }]
        },
    }
    return examples
}

const build = async (useTemplates: boolean | undefined, planText = plan) => {
    const llm = recordingLlm()
    const examples = countingExamples()
    const app = await buildApp({ config: { ...loadConfig({}), maxRepairAttempts: 0 }, llm, invokers, examples })
    await app.inject({
        method: 'POST', url: '/workflow/generate',
        payload: { prompt: 'Sync issues', from: tracker.name, to: helpdesk.name, plan: planText, ...(useTemplates === undefined ? {} : { useTemplates }) },
    })
    return { told: llm.requests.map((request) => request.messages.map((message) => message.content).join('\n')).join('\n'), examples }
}

const unparsablePlan = `- Read all objects.
- For each object (loop over the result of the previous step)
  - Create a ticket
- CreateTicket set title = script: "URGENT " before the summary when the priority is High.`

describe('building with or without templates', () => {
    it('shows template scripts as examples by default', async () => {
        const { told, examples } = await build(undefined)
        expect(examples.calls).toBeGreaterThan(0)
        expect(told).toContain('RESULT_VAR = "TEMPLATE " + VAR_0;')
    })

    it('leaves the templates out when the user switched them off', async () => {
        const { told, examples } = await build(false)
        expect(examples.calls).toBe(0)
        expect(told).not.toContain('TEMPLATE')
    })

    it('still offers the examples when the plan cannot be read as steps', async () => {
        const { told, examples } = await build(undefined, unparsablePlan)
        expect(examples.calls).toBe(1)
        expect(told).toContain('Similar transformations already used in this installation')
        expect((await build(false, unparsablePlan)).told).not.toContain('TEMPLATE')
    })
})
