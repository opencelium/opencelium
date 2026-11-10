import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { findSpokenMethod, isReferredTo, normalize } from '../guide/spokenNames.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { MappingRequest } from './mappingRequest.schema.ts'
import { withoutWords } from './operationWords.ts'

export type MappingIntentResult = {
    /** The method whose request body gets the references; empty when the request names none. */
    target: string
    /** The method whose response supplies the values; empty when the request names none. */
    source: string
    durationMs: number
    model: string
}

export type RouteMappingDeps = { llm: LlmClient; model: string; contextTokens: number }

function readMessage(prompt: string, methods: string[], keys: string[]): string {
    return `The user is building a workflow in OpenCelium and asks, in English or German, for references (a mapping) to be
suggested: the request body of one method (the target) gets filled with values from the response of another method
(the source).

Methods of the workflow:
${methods.map((method, index) => `${keys[index]}: ${method}`).join('\n')}

Request: ${JSON.stringify(prompt)}

- "target": the method whose fields are filled ("for X", "X's body", "into X", "für X", "in X"); empty when the request
  names none ("this method", "the selected one").
- "source": the method the values come from ("from Y", "with Y's response", "aus Y", "von Y", "mit der Antwort von Y");
  empty when the request names none.
"Map Y to X" / "ordne Y zu X zu": Y is the source, X the target.`
}

/** Names without separators, so a key that the model echoes with spaces or case changes still compares equal. */
const sameName = (left: string, right: string) => normalize(left) === normalize(right)

/** The methods the request spells out; one inside a longer spelled-out name ("getCustomers" in "getCustomersById") is not. */
function spelledOut(prompt: string, methods: string[]): string[] {
    const found = methods.filter((method) => findSpokenMethod(prompt, [method]))
    return found.filter((method) => !found.some((other) => other !== method && normalize(other).includes(normalize(method))))
}

/**
 * Reads "suggest references for X from Y": both constrained to the workflow's own method names, and each dropped unless
 * the request refers to it, so an unnamed target stays empty and the frontend falls back to the selected method.
 */
export async function routeMapping(request: MappingRequest, deps: RouteMappingDeps): Promise<MappingIntentResult> {
    const methods = request.methods.filter((method, index) => request.methods.findIndex((other) => sameName(other, method)) === index)
    const keys = methods.map((_, index) => `m${index + 1}`)
    const schema = z.object({ target: z.enum(['', ...keys]), source: z.enum(['', ...keys]) })
    const read = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: readMessage(request.prompt, methods, keys) }],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = schema.parse(JSON.parse(read.content))
    let target = methods[keys.indexOf(answer.target)] ?? ''
    let source = methods[keys.indexOf(answer.source)] ?? ''
    // The model mixes up close names (ConfigItemCreate for a spoken ConfigItemUpdate); a spelled-out name it missed wins.
    const spelled = spelledOut(request.prompt, methods)
    const unused = (other: string) => spelled.filter((method) => method !== other)
    if (spelled.length && !spelled.includes(target) && unused(source).length === 1) target = unused(source)[0]!
    if (spelled.length && !spelled.includes(source) && unused(target).length === 1) source = unused(target)[0]!
    // Checked without the other method's words: "this method from config item search" must not name ConfigItemCreate
    // through "config item", nor "for ticket create" name createClient as the source through "create".
    // Typed names are split first: withoutWords drops whole words, and "ConfigItemUpdate" would go for its "config".
    const spoken = request.prompt.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    const named = (method: string, other: string) =>
        method && isReferredTo(method, other ? withoutWords(spoken, other) : spoken) ? method : ''
    const result = { target: named(target, source), source: named(source, target) }
    // "suggest AI mapping from getCustomers" names only where the values come from: the target is the method whose
    // dialog is open, so it stays empty. The model reads a lone name as the target, or misses it.
    const fromOnly = result.source ? '' : result.target || (spelled.length === 1 && !result.target ? spelled[0]! : '')
    if (fromOnly && isOnlyAfterFrom(fromOnly, spoken)) {
        return { target: '', source: fromOnly, durationMs: read.durationMs, model: deps.model }
    }
    return { ...result, durationMs: read.durationMs, model: deps.model }
}

const FROM_RE = /\b(?:from|aus|von)\b/iu

/** Whether the request names `method` only after "from" / "aus" / "von", never before it. */
function isOnlyAfterFrom(method: string, spoken: string): boolean {
    const match = FROM_RE.exec(spoken)
    if (!match) return false
    const [before, after] = [spoken.slice(0, match.index), spoken.slice(match.index + match[0].length)]
    return isReferredTo(method, after) && !isReferredTo(method, before)
}
