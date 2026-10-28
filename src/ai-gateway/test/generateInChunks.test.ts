import { describe, expect, it } from 'vitest'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'
import { buildSkeleton } from '../src/plan/planSkeleton.ts'
import { assembleSkeleton, chunkSkeleton, flattenSkeleton } from '../src/plan/skeletonChunks.ts'
import { parsePlanText } from '../src/plan/renderPlanForBuild.ts'
import { generateWorkflow } from '../src/workflow/generateWorkflow.ts'
import { describeSkeleton } from '../src/plan/describeSkeleton.ts'
import { buildSkeletonSchema } from '../src/plan/planSkeleton.ts'
import { connectors } from './fixtures.ts'

/** Three rounds of "read the issues, then a ticket for each": seven steps, so two answers of up to six. */
const plan = Array.from({ length: 2 }, () => '- Read the issues with ListIssues.\n- For each issue (loop over the ListIssues result): create it with CreateTicket.')
    .join('\n') + '\n- Read the issues with ListIssues.'
const skeleton = buildSkeleton(parsePlanText(plan), connectors)

const STEP_RE = /(s\d+) \((?:method (\w+)|loop over the \w+ result of (s\d+)|if)/g

/** Answers exactly the steps a chunk asks for; `broken` makes the first answer for a step read a step that does not exist. */
function chunkAnsweringLlm(broken?: string): LlmClient & { requests: ChatRequest[] } {
    const requests: ChatRequest[] = []
    const asked = new Set<string>()
    return {
        requests,
        async chat(request) {
            requests.push(request)
            const text = request.messages.at(-1)?.content ?? ''
            const wanted = text.slice(text.indexOf('Fill now only these steps'))
            const steps = [...wanted.matchAll(STEP_RE)].map(([, id = '', operation, source]) => {
                if (source) return { id, kind: 'loop', over: { step: source, path: 'issues' } }
                if (operation === 'ListIssues') {
                    return { id, kind: 'method', connector: 'from', operation, params: [{ name: 'PROJECT', value: { literal: 'OC' } }], fields: [] }
                }
                const isBroken = id === broken && !asked.has(id)
                asked.add(id)
                const step = isBroken ? 's99' : `s${Number(id.slice(1)) - 1}`
                return { id, kind: 'method', connector: 'to', operation, params: [],
                    fields: [{ name: 'title', value: { ref: { step, path: 'fields.summary' } } }] }
            })
            return { content: JSON.stringify({ steps }), promptTokens: 10, outputTokens: 5, durationMs: 1 }
        },
        async listModels() { return [] },
    }
}

const deps = (llm: LlmClient) => ({ llm, model: 'm', contextTokens: 8192, maxRepairAttempts: 2 })
const constraint = () => ({ schema: buildSkeletonSchema(skeleton), userMessage: describeSkeleton('Tickets for issues', skeleton), skeleton })

describe('skeleton chunks', () => {
    it('lists the steps in document order and cuts them into runs of at most six', () => {
        expect(flattenSkeleton(skeleton.nodes).map((node) => `${node.id}:${node.kind}`)).toEqual(
            ['s1:method', 's2:loop', 's3:method', 's4:method', 's5:loop', 's6:method', 's7:method'])
        expect(chunkSkeleton(skeleton, 6).map((chunk) => chunk.length)).toEqual([6, 1])
    })

    it('assembles only when every step is filled', () => {
        expect(assembleSkeleton(skeleton, new Map())).toBeUndefined()
    })
})

describe('a large plan-fixed build', () => {
    it('is filled in short answers that see the earlier ones, and assembled with the plan\'s nesting', async () => {
        const llm = chunkAnsweringLlm()
        const result = await generateWorkflow('Tickets for issues', connectors, deps(llm), constraint())
        expect(llm.requests).toHaveLength(2)
        expect(llm.requests[1]?.messages.at(-1)?.content).toContain('Already filled (keep consistent with these):\n{"id":"s1"')
        expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([])
        expect(result.dsl.steps.map((step) => step.id)).toEqual(['s1', 's2', 's4', 's5', 's7'])
        const loop = result.dsl.steps[1]
        expect(loop?.kind === 'loop' && loop.body.map((step) => step.id)).toEqual(['s3'])
    })

    it('asks again only for the chunk that holds an error, telling it the problem', async () => {
        const llm = chunkAnsweringLlm('s6')
        const result = await generateWorkflow('Tickets for issues', connectors, deps(llm), constraint())
        expect(llm.requests).toHaveLength(3)
        const repair = llm.requests[2]?.messages.at(-1)?.content ?? ''
        expect(repair).toContain('- s6: ')
        expect(repair).toContain('Fill now only these steps, in this order: s1 (method ListIssues)')
        expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([])
    })
})
