import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import { type OperationRanker, focusConnectors, operationKey, restrictConnectors } from '../src/invokers/focusConnectors.ts'
import type { Invoker, InvokerOperation } from '../src/invokers/invoker.types.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { connectors, helpdesk, tracker } from './fixtures.ts'

const operation = (name: string, endpoint: string): InvokerOperation =>
    ({ name, httpMethod: 'GET', endpoint, endpointParams: [], requestFields: [], responseFields: [] })

/** A Netbox-sized invoker: hundreds of operations, a few of them about devices. */
const inventory: Invoker = {
    name: 'Inventory',
    description: '',
    requiredData: [],
    operations: [
        operation('dcim_devices_list', '{url}/api/dcim/devices/'),
        operation('dcim_devices_read', '{url}/api/dcim/devices/{id}/'),
        ...Array.from({ length: 300 }, (_, index) => operation(`circuits_provider_${index}`, `{url}/api/circuits/providers/${index}/`)),
    ],
}
const large = { from: inventory, to: helpdesk }
const keptNames = (invoker: Invoker | null) => invoker?.operations.map((op) => op.name) ?? []

describe('focusConnectors', () => {
    it('passes a pair that fits unchanged', async () => {
        const result = await focusConnectors(connectors, { text: 'anything', required: new Set(), budgetTokens: 8000 })
        expect(result.connectors).toBe(connectors)
        expect(result.omittedCount).toBe(0)
    })

    it('keeps the required operations and the closest ones within the budget', async () => {
        const result = await focusConnectors(large, {
            text: 'create a ticket for every device', required: new Set([operationKey('to', 'CreateTicket')]), budgetTokens: 120,
        })
        expect(keptNames(result.connectors.to)).toEqual(['CreateTicket'])
        expect(keptNames(result.connectors.from).slice(0, 2)).toEqual(['dcim_devices_list', 'dcim_devices_read'])
        expect(result.omittedCount).toBeGreaterThan(250)
        expect(result.describedTokens).toBeLessThanOrEqual(120 + 40)
    })

    it('ranks by meaning when a ranker is given', async () => {
        const ranker: OperationRanker = {
            async rank(invoker) {
                return new Map(invoker.operations.map((op) => [op.name, op.name === 'circuits_provider_7' ? 1 : 0]))
            },
        }
        const result = await focusConnectors(large, { text: 'who supplies the line', required: new Set(), budgetTokens: 40 }, ranker)
        expect(keptNames(result.connectors.from)).toEqual(['circuits_provider_7'])
    })
})

describe('restrictConnectors', () => {
    it('keeps an operation only on the side it is listed for', () => {
        const restricted = restrictConnectors(connectors, new Set([operationKey('from', 'ListIssues')]))
        expect(keptNames(restricted.from)).toEqual(['ListIssues'])
        expect(keptNames(restricted.to)).toEqual([])
    })
})

describe('a plan-fixed build', () => {
    it('tells the model only about the operations its plan calls', async () => {
        const requests: ChatRequest[] = []
        const llm: LlmClient = {
            async chat(request) {
                requests.push(request)
                return { content: '{}', promptTokens: 1, outputTokens: 1, durationMs: 1 }
            },
            async listModels() { return [] },
        }
        const invokers: InvokerRepository = {
            list: async () => [],
            get: async (name) => [inventory, tracker, helpdesk].find((invoker) => invoker.name === name),
        }
        const app = await buildApp({ config: { ...loadConfig({}), maxRepairAttempts: 0 }, llm, invokers })
        await app.inject({ method: 'POST', url: '/workflow/generate', payload: {
            prompt: 'Tickets for devices', from: 'Inventory', to: 'Helpdesk', useTemplates: false,
            plan: '- Read the devices with dcim_devices_list.\n- For each device (loop over the dcim_devices_list result): create it with CreateTicket.',
        } })
        const system = requests[0]?.messages[0]?.content ?? ''
        expect(system).toContain('- dcim_devices_list:')
        expect(system).not.toContain('circuits_provider_')
        expect(system).not.toContain('- dcim_devices_read:')
    })
})
