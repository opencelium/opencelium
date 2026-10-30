import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { assignableRequestPaths, extendsDeclaredObject, normalizePath } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import type { ChatMessage } from '../llm/llmClient.ts'
import type { RunAiDeps } from './explainFailure.ts'
import { type RunFailure, describeFailure, loadFailureContext, referencesNamedInError } from './runFailure.ts'

const headerSchema = z.object({ name: z.string().min(1).max(200), value: z.string().max(2000) })

type Header = z.infer<typeof headerSchema>

// Body and headers only: the editor keeps URL references as tokens with separate sources, which a text answer cannot carry.
const answerSchema = z.object({
    /** The whole request body, as the editor holds it (JSON text for JSON bodies). */
    body: z.string(),
    /** Only the headers to change or add, with their new value; the others keep their configured value. */
    headers: z.array(headerSchema).max(20).default([]),
    /** One line per change, e.g. `ConfigItem.Class: "Zabbix Host" → "Computer"`. */
    changes: z.array(z.string().min(1)).max(10),
})

export type FailureFix = z.infer<typeof answerSchema> & {
    /** All the step's headers after the fix, configured ones first. */
    headers: Header[]
    /** Rule violations left after the repair attempt; the UI shows them beside the proposal. */
    problems: string[]
    durationMs: number
    model: string
}

const MAX_ATTEMPTS = 2
const REFERENCE_RE = /#(\w+)\.\((?:response|request)\)/g
// A whole reference, to tell whether one the step had is still there.
const FULL_REFERENCE_RE = /#\w+\.\((?:response|request)\)[^"\s,}]*/g
const LOST_REFERENCES = 'References of the configured body are missing'
const LOST_HEADER_REFERENCES = 'References of the configured headers are missing'
const BROKEN_JSON = 'The body is no longer valid JSON'

const SYSTEM_PROMPT = `You fix one failed call of an OpenCelium integration workflow. Return the call's request body and
the headers to change, with the smallest change that removes the cause of the failure, and list each change.
- Start from the step as configured, not from the request body that was sent: the sent body has its references
  replaced by one run's values. Keep everything that is not part of the problem exactly as it is, including references.
- A reference reads an earlier step's response; write new ones exactly like the existing references in the body
  (#<color>.(response)...). Use only the colors of the earlier steps listed; [i] marks the current element of a loop.
- Use only fields the connector declares for the operation (or new attributes below an object field it declares).
- "headers" lists only the headers you change or add, each with its whole new value; leave it empty when the headers
  are fine. Header values take references the same way as the body.
- When the fault is in neither the body nor the headers (the URL, credentials, the connector's settings, an earlier
  step), return the body unchanged, no headers, and say in "changes" what to change instead.
Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

function leafPaths(value: unknown, prefix = ''): string[] {
    if (Array.isArray(value)) return value.flatMap((item) => leafPaths(item, `${prefix}[]`))
    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).flatMap(([key, nested]) => leafPaths(nested, prefix ? `${prefix}.${key}` : key))
    }
    return prefix ? [prefix] : []
}

const parseJson = (text: string): { value?: unknown; isJson: boolean } => {
    try {
        return { value: JSON.parse(text), isJson: true }
    } catch {
        return { isJson: false }
    }
}

/** The configured headers with the answered ones applied: a header named again (in any case) gets the new value. */
export function mergeHeaders(configured: Header[], changed: Header[]): Header[] {
    const merged = configured.map((header) => ({ ...header }))
    for (const header of changed) {
        const existing = merged.find((candidate) => candidate.name.toLowerCase() === header.name.trim().toLowerCase())
        if (existing) existing.value = header.value
        else merged.push({ name: header.name.trim(), value: header.value })
    }
    return merged
}

// The model sometimes changes a header without saying so; the list then names what changed.
const headerChanges = (configured: Header[], fixed: Header[]) => fixed.flatMap((header) => {
    const before = configured.find((candidate) => candidate.name === header.name)?.value
    return before === header.value ? [] : [`${header.name}: ${before ?? '(new)'} → ${header.value}`]
})

// A changed path keeps the count; fewer references than the step had means values were pasted in their place.
function lostReferences(before: string, after: string): string[] {
    const had = new Set(before.match(FULL_REFERENCE_RE) ?? [])
    const has = new Set(after.match(FULL_REFERENCE_RE) ?? [])
    return has.size < had.size ? [...had].filter((reference) => !has.has(reference)) : []
}

const headerText = (headers: Header[]) => headers.map((header) => header.value).join('\n')

/**
 * What the answer must not do: break a JSON body, read a step that does not exist, drop references or invent fields.
 * `headers` are all the step's headers after the fix; without them only the body is checked.
 */
export function checkFix(fix: { body: string; headers?: Header[] }, failure: RunFailure,
    declared?: { invoker: Invoker; operation: InvokerOperation }): string[] {
    const problems: string[] = []
    const original = parseJson(failure.step?.body ?? '')
    const fixed = parseJson(fix.body)
    if (original.isJson && !fixed.isJson) problems.push(BROKEN_JSON)
    const colors = new Set(failure.earlierSteps.map((step) => step.color.toLowerCase()))
    const unknown = [...`${fix.body}\n${headerText(fix.headers ?? [])}`.matchAll(REFERENCE_RE)]
        .map((match) => `#${match[1]}`).filter((color) => !colors.has(color.toLowerCase()))
    if (unknown.length) problems.push(`References to steps that do not exist: ${[...new Set(unknown)].join(', ')}`)
    const lost = lostReferences(failure.step?.body ?? '', fix.body)
    if (lost.length) problems.push(`${LOST_REFERENCES} (${lost.slice(0, 3).join(', ')}); keep them unless they are the fault`)
    // The reference the error names failed to resolve; a fix that keeps it as it is changes nothing that matters.
    const kept = referencesNamedInError(failure).filter((reference) => `${fix.body}\n${headerText(fix.headers ?? [])}`.includes(reference))
    if (kept.length) problems.push(`The reference the error names is unchanged (${kept.join(', ')}); correct its path`)
    const lostInHeaders = fix.headers ? lostReferences(headerText(failure.step?.headers ?? []), headerText(fix.headers)) : []
    if (lostInHeaders.length) {
        problems.push(`${LOST_HEADER_REFERENCES} (${lostInHeaders.slice(0, 3).join(', ')}); keep them unless they are the fault`)
    }
    if (declared && fixed.isJson && declared.operation.requestFields.length) {
        const allowed = assignableRequestPaths(declared.operation.requestFields, declared.invoker.requiredData)
        const known = new Set(allowed.map((field) => normalizePath(field.path)))
        const before = new Set(original.isJson ? leafPaths(original.value).map(normalizePath) : [])
        const invented = leafPaths(fixed.value).filter((path) => !before.has(normalizePath(path))
            && !known.has(normalizePath(path)) && !extendsDeclaredObject(allowed, path.replace(/\[\]/g, '[]')))
        if (invented.length) problems.push(`Fields the operation does not declare: ${invented.slice(0, 5).join(', ')}`)
    }
    return problems
}

export async function fixFailure(failure: RunFailure, deps: RunAiDeps): Promise<FailureFix> {
    if (!failure.step) throw new Error('Only a failed method call can be fixed')
    const context = await loadFailureContext(failure, deps.invokers)
    const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: describeFailure(failure, context) }]
    let best: FailureFix | undefined
    let durationMs = 0
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const result = await deps.llm.chat({ model: deps.model, messages, format: answerFormat, contextTokens: deps.contextTokens,
            temperature: attempt === 0 ? 0 : 0.3 })
        durationMs += result.durationMs
        const parsed = answerSchema.safeParse(parseJson(result.content).value)
        if (!parsed.success) continue
        const answer = { ...parsed.data, headers: mergeHeaders(failure.step.headers, parsed.data.headers) }
        const problems = checkFix(answer, failure, context.declared)
        if (!best || problems.length < best.problems.length) best = { ...answer, problems, durationMs, model: deps.model }
        if (problems.length === 0) break
        messages.push({ role: 'assistant', content: result.content },
            { role: 'user', content: `The answer has these problems:\n${problems.map((problem) => `- ${problem}`).join('\n')}\nReturn the corrected answer.` })
    }
    if (!best) throw new Error('The model did not return a usable fix')
    best = { ...best, changes: best.changes.length ? best.changes : headerChanges(failure.step.headers, best.headers) }
    // A body that no longer parses, or a body or headers with one run's values in place of references, would break the
    // step: that part stays as configured, and the problems are checked again on what is offered.
    const isBodyBroken = best.problems.some((problem) => problem === BROKEN_JSON || problem.startsWith(LOST_REFERENCES))
    const areHeadersBroken = best.problems.some((problem) => problem.startsWith(LOST_HEADER_REFERENCES))
    if (!isBodyBroken && !areHeadersBroken) return { ...best, durationMs }
    const offered = { body: isBodyBroken ? failure.step.body : best.body, headers: areHeadersBroken ? failure.step.headers : best.headers }
    return { ...best, ...offered, problems: checkFix(offered, failure, context.declared), durationMs }
}
