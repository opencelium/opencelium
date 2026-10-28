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

const PLACEHOLDER_RE = /\{\{[^{}]*\}\}/g
const MAX_ATTEMPTS = 2

const SYSTEM_PROMPT = `You write notification texts for OpenCelium, an integration platform that runs scheduled
workflows. A notification is sent before or after a scheduled run, or when it fails. Write a subject and a body.
- Write for the people who receive it: what happened, which workflow or data it is about, and what to do if anything.
- Insert dynamic values only with the placeholders listed, written exactly as listed ({{name.arg}}); never invent one.
  If no placeholder fits, write the text without one.
- E-mail: a short greeting, two to five short sentences or a short list, and a sign-off line. Chat tools (Teams, Slack,
  ...): one to three short lines, no greeting or sign-off; the subject is a short title.
- Plain text, no HTML or Markdown. The subject has at most 120 characters.
Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

function describe(request: DraftNotificationRequest): string {
    const placeholders = request.placeholders.length
        ? request.placeholders.map((placeholder) => `- ${placeholder.token}${placeholder.description ? `: ${placeholder.description}` : ''}`).join('\n')
        : '- (none: write the text without dynamic values)'
    const current = request.current.subject || request.current.body
        ? `\n\nCurrent text (change it as asked; keep what the request does not mention):\nSubject: ${request.current.subject}\nBody:\n${request.current.body}`
        : ''
    return `Notification template${request.templateName ? ` "${request.templateName}"` : ''}, sent via ${request.type || 'e-mail'}.
Request: ${request.instruction}

Placeholders:
${placeholders}${current}

Write it in ${request.language === 'de' ? 'German' : 'English'}.`
}

const unknownPlaceholders = (text: string, allowed: ReadonlySet<string>) =>
    [...new Set(text.match(PLACEHOLDER_RE) ?? [])].filter((token) => !allowed.has(token))

/** A subject and body that use only the listed placeholders; invented ones are sent back once, then removed. */
export async function draftNotification(request: DraftNotificationRequest, deps: DraftNotificationDeps): Promise<NotificationDraft> {
    const allowed = new Set(request.placeholders.map((placeholder) => placeholder.token))
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
        draft = parsed.data
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
