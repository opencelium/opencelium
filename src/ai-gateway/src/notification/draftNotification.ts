import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { ChatMessage, LlmClient } from '../llm/llmClient.ts'

export const draftNotificationRequestSchema = z.object({
    /** The language of the notification text itself, which need not be the user's. */
    language: z.enum(['en', 'de']).default('en'),
    /** The message tool: email, or a chat tool such as Teams or Slack. */
    type: z.string().max(100).default(''),
    templateName: z.string().max(300).default(''),
    /** What the notification is for, in the user's words. */
    instruction: z.string().trim().min(1).max(2000),
    /** The values the text may insert, as written in the template: `{{aggregatorName.argName}}`. */
    placeholders: z.array(z.object({ token: z.string().max(300), description: z.string().max(500).default('') })).max(100).default([]),
    /** The texts already in the form, so "make it shorter" refines instead of starting over. */
    current: z.object({ subject: z.string().max(1000).default(''), body: z.string().max(20_000).default('') }).default({ subject: '', body: '' }),
})

export type DraftNotificationRequest = z.infer<typeof draftNotificationRequestSchema>

const answerSchema = z.object({ subject: z.string().min(1).max(255), body: z.string().min(1) })

export type NotificationDraft = z.infer<typeof answerSchema> & {
    /** Placeholders the model invented; they were removed from the text. */
    removedPlaceholders: string[]
    durationMs: number
    model: string
}

export type DraftNotificationDeps = { llm: LlmClient; model: string; contextTokens: number }

// Aggregator values ({{agg.arg}}) and the built-in ones ({SCHEDULER_TITLE}); the double-brace form is tried first.
// Any single-brace word counts too, so a value with the wrong brace count ({agg.arg}) is caught instead of sent as text.
const PLACEHOLDER_RE = /\{\{[^{}]*\}\}|\{[^{}\s]+\}/g

/** Values every template may use, whatever its aggregator (docs: guides/schedule-and-notify › Notifications). */
export const BUILT_IN_PLACEHOLDERS: { token: string; description: string }[] = [
    { token: '{USER_NAME}', description: 'first name of the user the notification goes to' },
    { token: '{USER_SURNAME}', description: 'last name of that user' },
    { token: '{USER_TITLE}', description: 'title of that user' },
    { token: '{USER_DEPARTMENT}', description: 'department of that user' },
    { token: '{CONNECTION_ID}', description: 'id of the workflow' },
    { token: '{CONNECTION_NAME}', description: 'name of the workflow' },
    { token: '{SCHEDULER_ID}', description: 'id of the schedule' },
    { token: '{SCHEDULER_TITLE}', description: 'title of the schedule' },
]
const MAX_ATTEMPTS = 2

const SYSTEM_PROMPT = `You write notification texts for OpenCelium, an integration platform that runs scheduled
workflows. A notification is sent before or after a scheduled run, or when it fails. Write a subject and a body.
- Write for the people who receive it: what happened, which workflow or data it is about, and what to do if anything.
- Insert dynamic values only with the placeholders listed, written exactly as listed ({SCHEDULER_TITLE}, {{name.arg}});
  never invent one. Prefer the schedule and workflow names so the reader knows which run it is about.
  If no placeholder fits, write the text without one.
- E-mail: a short greeting, two to five short sentences or a short list, and a sign-off line. Chat tools (Teams, Slack,
  ...): one to three short lines, no greeting or sign-off; the subject is a short title.
- Plain text, no HTML or Markdown. The subject has at most 120 characters.
Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

function describe(request: DraftNotificationRequest): string {
    const line = (placeholder: { token: string; description: string }) =>
        `- ${placeholder.token}${placeholder.description ? `: ${placeholder.description}` : ''}`
    const aggregator = request.placeholders.length
        ? `\nFrom the template's data aggregator (filled only for "post" notifications, sent after a run):\n${request.placeholders.map(line).join('\n')}`
        : ''
    const placeholders = `Always available:\n${BUILT_IN_PLACEHOLDERS.map(line).join('\n')}${aggregator}`
    const current = request.current.subject || request.current.body
        ? `\n\nCurrent text (change it as asked; keep what the request does not mention):\nSubject: ${request.current.subject}\nBody:\n${request.current.body}`
        : ''
    return `Notification template${request.templateName ? ` "${request.templateName}"` : ''}, sent via ${request.type || 'e-mail'}.
Request: ${request.instruction}

Placeholders:
${placeholders}${current}

Write it in ${request.language === 'de' ? 'German' : 'English'}.`
}

const placeholderName = (token: string) => token.replace(/^\{+|\}+$/g, '')

/** Gives a listed placeholder written with the wrong brace count ({agg.arg}, {{SCHEDULER_TITLE}}) its listed form. */
function fixBraces(text: string, allowed: ReadonlySet<string>): string {
    const byName = new Map([...allowed].map((token) => [placeholderName(token), token]))
    return text.replace(PLACEHOLDER_RE, (token) => (allowed.has(token) ? token : byName.get(placeholderName(token)) ?? token))
}

const unknownPlaceholders = (text: string, allowed: ReadonlySet<string>) =>
    [...new Set(text.match(PLACEHOLDER_RE) ?? [])].filter((token) => !allowed.has(token))

/** A subject and body that use only the listed placeholders; invented ones are sent back once, then removed. */
export async function draftNotification(request: DraftNotificationRequest, deps: DraftNotificationDeps): Promise<NotificationDraft> {
    const allowed = new Set([...BUILT_IN_PLACEHOLDERS, ...request.placeholders].map((placeholder) => placeholder.token))
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: describe(request) }]
    let durationMs = 0
    let draft: z.infer<typeof answerSchema> | undefined
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const result = await deps.llm.chat({ model: deps.model, messages, format: answerFormat, contextTokens: deps.contextTokens,
            temperature: attempt === 0 ? 0.2 : 0.4 })
        durationMs += result.durationMs
        let json: unknown
        try {
            json = JSON.parse(result.content)
        } catch {
            continue
        }
        const parsed = answerSchema.safeParse(json)
        if (!parsed.success) continue
        draft = { subject: fixBraces(parsed.data.subject, allowed), body: fixBraces(parsed.data.body, allowed) }
        const invented = unknownPlaceholders(`${draft.subject}\n${draft.body}`, allowed)
        if (invented.length === 0) break
        messages.push({ role: 'assistant', content: result.content },
            { role: 'user', content: `These placeholders do not exist: ${invented.join(', ')}. Use only the listed ones, or none. Return the corrected text.` })
    }
    if (!draft) throw new Error('The model did not return a usable notification text')
    const removed = unknownPlaceholders(`${draft.subject}\n${draft.body}`, allowed)
    const strip = (text: string) => text.replace(PLACEHOLDER_RE, (token) => (allowed.has(token) ? token : '')).replace(/[ \t]{2,}/g, ' ')
    return { subject: strip(draft.subject).trim(), body: strip(draft.body).trim(), removedPlaceholders: removed, durationMs, model: deps.model }
}
