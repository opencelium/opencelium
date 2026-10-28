import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { assignableRequestPaths, extendsDeclaredObject, normalizePath } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import type { ChatMessage } from '../llm/llmClient.ts'
import type { RunAiDeps } from './explainFailure.ts'
import { type RunFailure, describeFailure, loadFailureContext } from './runFailure.ts'

// Only the body: the editor keeps URL references as tokens with separate sources, which a text answer cannot carry.
const answerSchema = z.object({
    /** The whole request body, as the editor holds it (JSON text for JSON bodies). */
    body: z.string(),
    /** One line per change, e.g. `ConfigItem.Class: "Zabbix Host" → "Computer"`. */
    changes: z.array(z.string().min(1)).max(10),
})

export type FailureFix = z.infer<typeof answerSchema> & {
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

const SYSTEM_PROMPT = `You fix one failed call of an OpenCelium integration workflow. Return the call's request body with
the smallest change that removes the cause of the failure, and list each change.
- Start from the step as configured, not from the request body that was sent: the sent body has its references
  replaced by one run's values. Keep everything that is not part of the problem exactly as it is, including references.
- A reference reads an earlier step's response; write new ones exactly like the existing references in the body
  (#<color>.(response)...). Use only the colors of the earlier steps listed; [i] marks the current element of a loop.
- Use only fields the connector declares for the operation (or new attributes below an object field it declares).
- When the fault is not in the body (the URL, credentials, the connector's settings, an earlier step), return the body
  unchanged and say in "changes" what to change instead.
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

/** What the answer must not do: break a JSON body, read a step that does not exist, or invent fields. */
export function checkFix(fix: z.infer<typeof answerSchema>, failure: RunFailure,
    declared?: { invoker: Invoker; operation: InvokerOperation }): string[] {
    const problems: string[] = []
    const original = parseJson(failure.step?.body ?? '')
    const fixed = parseJson(fix.body)
    if (original.isJson && !fixed.isJson) problems.push('The body is no longer valid JSON')
    const colors = new Set(failure.earlierSteps.map((step) => step.color.toLowerCase()))
    const unknown = [...fix.body.matchAll(REFERENCE_RE)]
        .map((match) => `#${match[1]}`).filter((color) => !colors.has(color.toLowerCase()))
    if (unknown.length) problems.push(`References to steps that do not exist: ${[...new Set(unknown)].join(', ')}`)
    // A changed path keeps the count; fewer references than the step had means values were pasted in their place.
    const before = new Set(failure.step?.body.match(FULL_REFERENCE_RE) ?? [])
    const after = new Set(fix.body.match(FULL_REFERENCE_RE) ?? [])
    if (after.size < before.size) {
        const lost = [...before].filter((reference) => !after.has(reference))
        problems.push(`${LOST_REFERENCES} (${lost.slice(0, 3).join(', ')}); keep them unless they are the fault`)
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
        const problems = checkFix(parsed.data, failure, context.declared)
        if (!best || problems.length < best.problems.length) best = { ...parsed.data, problems, durationMs, model: deps.model }
        if (problems.length === 0) break
        messages.push({ role: 'assistant', content: result.content },
            { role: 'user', content: `The answer has these problems:\n${problems.map((problem) => `- ${problem}`).join('\n')}\nReturn the corrected answer.` })
    }
    if (!best) throw new Error('The model did not return a usable fix')
    // Applying a body with one run's values in place of references would break every other run: offer the advice only.
    if (best.problems.some((problem) => problem.startsWith(LOST_REFERENCES))) {
        return { ...best, body: failure.step.body, problems: best.problems.filter((problem) => !problem.startsWith(LOST_REFERENCES)), durationMs }
    }
    return { ...best, durationMs }
}
