import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { type DraftOperation, type InvokerDraft, invokerDraftSchema } from './invokerDraft.schema.ts'

export type DraftFromDocsDeps = { llm: LlmClient; model: string; contextTokens: number }

// About a third of the context: the answer (every operation with its fields) needs the rest.
const MAX_DOC_CHARS = 18_000

const SYSTEM_PROMPT = `You turn REST API documentation into an OpenCelium invoker: the list of HTTP operations a
workflow can call. Answer with JSON only.
- "name": the system's or product's name (e.g. Deskly), never an operation name.
- Include only operations the documentation describes, at most 40; prefer reading, creating and updating the main records.
- "name": a short unique PascalCase verb + noun, e.g. GetTickets, CreateTicket, UpdateUser.
- "path": exactly as documented, after the base URL, starting with "/"; path parameters as {name}. Required query
  parameters go into the path as ?name={name}.
- "request": the JSON body fields the operation accepts, nested as documented; null for operations without a body.
- "response": the fields of a successful response, nested; "type" is "array" when the body is a list.
- "auth": basic (username + password), bearer (token in Authorization), apikeyHeader / apikeyQuery (an API key in a
  header or query parameter; "keyName" is its name), or none.
- "baseUrl": the documented base URL, with placeholders such as {instance} for the customer's part.
- "testOperation": the name of a cheap GET without parameters, to check a connector's settings.
Never invent operations, paths or fields the documentation does not show.`

const answerFormat = toJsonSchema(invokerDraftSchema)

/** Readable text from an HTML page: scripts, styles and tags removed, entities for the common characters decoded. */
export function docsText(docs: string): string {
    if (!/<(html|body|div|p|table|h[1-6])\b/i.test(docs)) return docs
    return docs
        .replace(/<(script|style|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>|<\/(p|div|li|tr|h[1-6]|pre)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n\n')
        .trim()
}

/** A full URL in a path becomes the part after the base URL; names are made unique. */
function tidyOperations(draft: InvokerDraft): DraftOperation[] {
    const basePath = (() => {
        try {
            return new URL(draft.baseUrl.replace(/\{[^{}]+\}/g, 'x')).pathname.replace(/\/+$/, '')
        } catch {
            return ''
        }
    })()
    const used = new Set<string>()
    return draft.operations.map((operation) => {
        let path = operation.path.replace(/^https?:\/\/[^/]+/i, '')
        if (basePath && path.startsWith(`${basePath}/`)) path = path.slice(basePath.length)
        if (!path.startsWith('/')) path = `/${path}`
        let name = operation.name
        for (let suffix = 2; used.has(name); suffix++) name = `${operation.name}${suffix}`
        used.add(name)
        // A GET or DELETE has no body; query parameters belong in the path.
        const request = operation.method === 'GET' || operation.method === 'DELETE' ? null : operation.request
        return { ...operation, name, path, request }
    })
}

export type DocsDraft = { draft: InvokerDraft; isTruncated: boolean; durationMs: number }

export async function draftFromDocs(docs: string, nameHint: string, deps: DraftFromDocsDeps): Promise<DocsDraft> {
    const text = docsText(docs)
    const isTruncated = text.length > MAX_DOC_CHARS
    const shown = isTruncated ? `${text.slice(0, MAX_DOC_CHARS)}\n[... the rest of the documentation is cut off]` : text
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `${nameHint ? `The system is called "${nameHint}".\n\n` : ''}Documentation:\n${shown}` },
        ],
        format: answerFormat,
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable invoker')
    }
    const parsed = invokerDraftSchema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable invoker')
    const operations = tidyOperations(parsed.data)
    const reads = operations.filter((operation) => operation.method === 'GET' && !operation.path.includes('{'))
    const testOperation = reads.some((operation) => operation.name === parsed.data.testOperation)
        ? parsed.data.testOperation : reads[0]?.name ?? ''
    const draft = { ...parsed.data, name: nameHint || parsed.data.name, operations, testOperation }
    return { draft, isTruncated, durationMs: result.durationMs }
}
