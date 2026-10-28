import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.ts'
import { loadConfig } from '../src/config.ts'
import type { DocsIndex, FoundSection } from '../src/help/docsIndex.ts'
import { parseDocsPage, sectionAnchor } from '../src/help/docsSections.ts'
import type { InvokerRepository } from '../src/invokers/invokerRepository.ts'
import type { ChatRequest, LlmClient } from '../src/llm/llmClient.ts'

const page = `.. _guide-schedule:

####################
Schedule and notify
####################

.. contents::
   :local:

Create a schedule
=================

Either from **Schedules → Create** or the
**Add schedule** pill. See :doc:\`../concepts/execution\` and :ref:\`cron <ref-cron>\`.

* a title (mandatory),
* a workflow.

.. image:: ../img/schedule.png
   :alt: Schedule wizard

Cron expressions
----------------

OpenCelium uses \`\`Quartz\`\`.

.. note::
   Six or seven fields.
`

describe('parseDocsPage', () => {
    const sections = parseDocsPage('guides/schedule-and-notify', page)

    it('splits a page into its sections with heading path, anchor and plain text', () => {
        expect(sections.map((section) => [section.titles.join(' › '), section.anchor])).toEqual([
            ['Schedule and notify › Create a schedule', 'create-a-schedule'],
            ['Schedule and notify › Create a schedule › Cron expressions', 'cron-expressions'],
        ])
        expect(sections[0]?.text).toBe('Either from Schedules → Create or the\nAdd schedule pill. See execution and cron.\n\n- a title (mandatory),\n- a workflow.')
        expect(sections[1]?.text).toBe('OpenCelium uses Quartz.\n\nNOTE:\n   Six or seven fields.')
    })

    it('makes anchors the way Sphinx does', () => {
        expect(sectionAnchor('Channel payloads (Teams & Slack)')).toBe('channel-payloads-teams-slack')
    })
})

const section = (title: string, score: number): FoundSection =>
    ({ page: 'guides/schedule-and-notify', titles: ['Schedule and notify', title], anchor: sectionAnchor(title), text: `About ${title}.`, score })

describe('POST /help/ask', () => {
    const appWith = async (found: FoundSection[], stream = true) => {
        const requests: ChatRequest[] = []
        const questions: string[] = []
        const llm: LlmClient = {
            async chat(request) {
                requests.push(request)
                return { content: JSON.stringify({ question: 'How do I notify only on failures?' }), promptTokens: 1, outputTokens: 1, durationMs: 1 }
            },
            ...(stream ? {
                async *stream(request: ChatRequest) {
                    requests.push(request)
                    yield 'Use the '
                    yield 'alert event [1].'
                },
            } : {}),
            async listModels() { return [] },
        }
        const docs: DocsIndex = { find: async (question) => { questions.push(question); return found }, warmUp: async () => undefined }
        const invokers: InvokerRepository = { list: async () => [], get: async () => undefined }
        const app = await buildApp({ config: loadConfig({}), llm, invokers, docs })
        return { app, requests, questions }
    }
    const events = (body: string) => body.trim().split('\n').map((line) => JSON.parse(line) as Record<string, unknown>)

    it('streams the sources, the answer as it is written, and the commands that fit', async () => {
        const { app, requests, questions } = await appWith([section('Notifications', 0.71), section('Webhooks', 0.3)])
        const response = await app.inject({ method: 'POST', url: '/help/ask', payload: {
            language: 'de', page: '/schedule', messages: [{ role: 'user', content: 'How do I get a mail when a schedule fails?' }],
            commands: [{ id: 'create-template', phrase: 'create notification template', description: 'New notification template' }],
        } })
        expect(response.headers['content-type']).toContain('application/x-ndjson')
        const [sources, ...rest] = events(response.body)
        expect(sources).toEqual({ type: 'sources', question: 'How do I get a mail when a schedule fails?', sources: [
            { n: 1, title: 'Schedule and notify › Notifications', url: 'https://docs.opencelium.io/en/prod/guides/schedule-and-notify.html#notifications' },
        ] })
        expect(rest.filter((event) => event.type === 'delta').map((event) => event.text).join('')).toBe('Use the alert event [1].')
        expect(rest.at(-1)?.type).toBe('done')
        expect(questions).toEqual(['How do I get a mail when a schedule fails?'])
        const answer = requests.at(-1)?.messages ?? []
        expect(answer[0]?.content).toContain('Answer in German. The user is on the page /schedule.')
        expect(answer.at(-1)?.content).toContain('[1] Schedule and notify › Notifications\nAbout Notifications.')
        expect(answer.at(-1)?.content).not.toContain('Webhooks')
    })

    it('makes a follow-up standalone before searching, and answers without streaming when the client cannot', async () => {
        const { app, questions } = await appWith([], false)
        const response = await app.inject({ method: 'POST', url: '/help/ask', payload: { messages: [
            { role: 'user', content: 'How do I add a notification?' },
            { role: 'assistant', content: 'Attach it to the schedule [1].' },
            { role: 'user', content: 'And only for failures?' },
        ] } })
        expect(questions).toEqual(['How do I notify only on failures?'])
        const parsed = events(response.body)
        expect(parsed[0]).toMatchObject({ type: 'sources', sources: [] })
        expect(parsed[1]).toMatchObject({ type: 'delta' })
    })

    it('rejects a conversation that does not end with the user', async () => {
        const { app } = await appWith([])
        const response = await app.inject({ method: 'POST', url: '/help/ask', payload: { messages: [{ role: 'assistant', content: 'Hi' }] } })
        expect(response.statusCode).toBe(400)
    })
})
