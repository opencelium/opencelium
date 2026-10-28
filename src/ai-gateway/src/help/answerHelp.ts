import { z } from 'zod'
import type { CommandIndex } from '../command/commandIndex.ts'
import { catalogCommandSchema } from '../command/commandRequest.schema.ts'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { ChatMessage, ChatRequest, LlmClient } from '../llm/llmClient.ts'
import type { DocsIndex, FoundSection } from './docsIndex.ts'

export const helpRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    /** The conversation so far, the user's new message last. */
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(4000) }))
        .min(1).max(30).refine((messages) => messages.at(-1)?.role === 'user', 'The last message must be the user\'s'),
    /** Where the user is, e.g. `/schedule` or `/workflow/update/12`: "here" and "this" depend on it. */
    page: z.string().max(300).default(''),
    /** The palette commands this user may run, to offer the ones the answer is about. */
    commands: z.array(catalogCommandSchema).max(1000).default([]),
})

export type HelpRequest = z.infer<typeof helpRequestSchema>

export type HelpSource = { n: number; title: string; url: string }

/** What `/help/ask` streams, one JSON object per line. */
export type HelpEvent =
    | { type: 'sources'; question: string; sources: HelpSource[] }
    | { type: 'delta'; text: string }
    | { type: 'done'; commands: string[] }

export type HelpDeps = {
    llm: LlmClient
    /** Writes the answer. */
    model: string
    /** Rewrites a follow-up into a standalone question: a small, fast model is enough. */
    rewriteModel: string
    contextTokens: number
    docs: DocsIndex
    commands: CommandIndex
    /** The published documentation, e.g. https://docs.opencelium.io/en/prod */
    docsUrl: string
}

const MAX_SOURCES = 5
// Only drops clear noise: measured on the help questions, relevant and unrelated sections both score 0.7–0.8 with
// nomic-embed-text, so whether the docs answer a question is decided by the answering model, not by this cut-off.
const MIN_SOURCE_SCORE = 0.5
// The answer keeps only recent turns: a small model gets worse, not better, with a long history.
const HISTORY_TURNS = 6
const MAX_COMMANDS = 3

const languageName = (language: HelpRequest['language']) => (language === 'de' ? 'German' : 'English')

const ANSWER_PROMPT = `You are the help assistant of OpenCelium, an integration platform. Answer the user's question using
only the numbered documentation excerpts you are given, and cite them like [1] or [2] after the sentences they support.
- If the excerpts do not answer the question, say plainly that the documentation does not describe it, and do not
  guess: a wrong instruction is worse than none. You may say which excerpt comes closest.
- Be short: a sentence or two, or numbered steps for a task. Name menu entries and buttons as the excerpts do.
- Never invent menu entries, settings, commands or values.`

const standaloneSchema = z.object({ question: z.string().min(1) })

/** "And for failures only?" → "How do I send a notification only when a schedule fails?", so the docs search works. */
async function standaloneQuestion(request: HelpRequest, deps: HelpDeps): Promise<string> {
    const last = request.messages.at(-1)?.content ?? ''
    if (request.messages.length === 1) return last
    const conversation = request.messages.slice(-HISTORY_TURNS)
        .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content.slice(0, 1200)}`).join('\n')
    try {
        const result = await deps.llm.chat({
            model: deps.rewriteModel,
            messages: [
                { role: 'system', content: 'Rewrite the user\'s last message as one standalone question that can be understood without the conversation. Keep its language. Answer with JSON only.' },
                { role: 'user', content: conversation },
            ],
            format: toJsonSchema(standaloneSchema),
            contextTokens: deps.contextTokens,
            temperature: 0,
        })
        const parsed = standaloneSchema.safeParse(JSON.parse(result.content))
        return parsed.success ? parsed.data.question : last
    } catch {
        return last
    }
}

function relevantSections(found: FoundSection[]): FoundSection[] {
    return found.filter((section) => section.score >= MIN_SOURCE_SCORE).slice(0, MAX_SOURCES)
}

const sourceOf = (section: FoundSection, n: number, docsUrl: string): HelpSource =>
    ({ n, title: section.titles.join(' › '), url: `${docsUrl}/${section.page}.html#${section.anchor}` })

function answerMessages(request: HelpRequest, question: string, sections: FoundSection[]): ChatMessage[] {
    const excerpts = sections.length
        ? sections.map((section, index) => `[${index + 1}] ${section.titles.join(' › ')}\n${section.text}`).join('\n\n')
        : '(no excerpt matches the question)'
    const history = request.messages.slice(-HISTORY_TURNS, -1).map((message): ChatMessage => ({ role: message.role, content: message.content }))
    return [
        { role: 'system', content: `${ANSWER_PROMPT}\nAnswer in ${languageName(request.language)}.${request.page ? ` The user is on the page ${request.page}.` : ''}` },
        ...history,
        { role: 'user', content: `Documentation excerpts:\n\n${excerpts}\n\nQuestion: ${question}` },
    ]
}

async function* textOf(llm: LlmClient, chat: ChatRequest): AsyncGenerator<string> {
    if (llm.stream) {
        yield* llm.stream(chat)
        return
    }
    yield (await llm.chat(chat)).content
}

/**
 * Answers from the documentation only: the question (made standalone for a follow-up) finds the closest sections, the
 * model answers from those and cites them, and commands the user may run are offered when they fit the question.
 */
export async function* answerHelp(request: HelpRequest, deps: HelpDeps): AsyncGenerator<HelpEvent> {
    const question = await standaloneQuestion(request, deps)
    const sections = relevantSections(await deps.docs.find(question, MAX_SOURCES * 2))
    yield { type: 'sources', question, sources: sections.map((section, index) => sourceOf(section, index + 1, deps.docsUrl)) }
    const chat: ChatRequest = { model: deps.model, messages: answerMessages(request, question, sections), contextTokens: deps.contextTokens, temperature: 0.1 }
    for await (const text of textOf(deps.llm, chat)) if (text) yield { type: 'delta', text }
    const ranked = request.commands.length ? await deps.commands.rank(question, request.commands, MAX_COMMANDS) : []
    yield { type: 'done', commands: ranked.map((command) => command.id) }
}
