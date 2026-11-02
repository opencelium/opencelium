import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { isReferredTo, normalize } from '../guide/spokenNames.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { TransformationRequest } from './transformationRequest.schema.ts'
import { sharedWords, wordsOf } from './operationWords.ts'

export type TransformationIntentResult = {
    /** The field the transformation is for; empty when the request names none of the open editor's fields. */
    field: string
    /** The field as the user named it; empty when they named none ("this property"), so the selected field is meant. */
    spokenField: string
    /** What the script should do, in the user's words, for the script generator. */
    description: string
    durationMs: number
    model: string
}

export type RouteTransformationDeps = { llm: LlmClient; model: string; contextTokens: number }

function readMessage(prompt: string, fields: string[], keys: string[]): string {
    return `The user edits the request of a method in OpenCelium and asks, in English or German, for a transformation (a
script that changes a referenced value before it is sent) on one field.

Fields:
${fields.map((field, index) => `${keys[index]}: ${field}`).join('\n')}

Request: ${JSON.stringify(prompt)}

- "field": the field the transformation is for ("for X", "on X", "für X"); empty when it names none of them.
- "spokenField": that field as the user said it, even when it is none of the fields above; empty when the request names
  no field ("this property", "it", "diese Eigenschaft", or nothing).
- "description": what the script should do, as the user said it, without the field part (e.g. "convert to upper case",
  "nimm nur die ersten 10 Zeichen"); empty when the request does not say.`
}

/** Words pointing at the selected field rather than naming one. */
const DEICTIC_RE = /^(this|that|it|the selected|selected|current|the current|dies|diese|dieses|dieser|die ausgewählte|ausgewählte|aktuelle|die aktuelle)\b/i

/** The last segment of a path, which is what a user names: "vendor" for ConfigItem.CIXMLData.Vendor. */
const leafOf = (path: string) => path.split(/[.[\]]+/).filter(Boolean).pop() ?? path

/**
 * A field the request spells out: its whole path, else its last segment. Longest first, so "config item number" finds
 * ConfigItem.Number before a field called "Number" somewhere else, and only when exactly one field fits.
 */
function spelledOut(prompt: string, fields: string[]): string {
    const said = normalize(prompt)
    const whole = fields.filter((field) => normalize(field).length >= 3 && said.includes(normalize(field)))
        .sort((left, right) => normalize(right).length - normalize(left).length)
    if (whole[0]) return whole[0]
    // A short name ("id") only as a word of its own: inside other words it is everywhere.
    const words = prompt.split(/[^\p{L}\p{N}]+/u).map(normalize)
    const short = fields.find((field) => normalize(field).length > 0 && normalize(field).length < 3 && words.includes(normalize(field)))
    if (short) return short
    const byLeaf = fields.filter((field) => normalize(leafOf(field)).length >= 3 && said.includes(normalize(leafOf(field))))
    const longest = Math.max(0, ...byLeaf.map((field) => normalize(leafOf(field)).length))
    const best = byLeaf.filter((field) => normalize(leafOf(field)).length === longest)
    return best.length === 1 ? best[0]! : ''
}

/** The one field whose last segment the request says word for word, German included ("Seriennummer" → SerialNumber). */
function saidInWords(prompt: string, fields: string[]): string {
    const promptWords = wordsOf(prompt)
    const said = fields.filter((field) => {
        const words = wordsOf(leafOf(field))
        // A German compound is one word for the whole name: "seriennummer" is SerialNumber, not "serial" + "number".
        return promptWords.includes(normalize(leafOf(field)))
            || (words.length > 0 && sharedWords(prompt, leafOf(field)) === words.length)
    })
    return said.length === 1 ? said[0]! : ''
}

/**
 * Reads "apply transformation for <field> with <what the script does>": the field constrained to the open editor's
 * own fields, the description left in the user's words for the script generator.
 */
export async function routeTransformation(request: TransformationRequest, deps: RouteTransformationDeps): Promise<TransformationIntentResult> {
    const keys = request.fields.map((_, index) => `f${index + 1}`)
    const schema = z.object({ field: z.enum(['', ...keys]), spokenField: z.string(), description: z.string() })
    const read = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: readMessage(request.prompt, request.fields, keys) }],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = schema.parse(JSON.parse(read.content))
    const picked = request.fields[keys.indexOf(answer.field)] ?? ''
    // A spelled-out field wins over the model's pick; the pick counts only when the request refers to its last segment.
    const field = spelledOut(request.prompt, request.fields) || (picked && isReferredTo(leafOf(picked), request.prompt) ? picked : '')
        || saidInWords(request.prompt, request.fields)
    // "this property" names none: the frontend then takes the field selected in the editor.
    const said = answer.spokenField.trim()
    const spokenField = field ? said || field : DEICTIC_RE.test(said) ? '' : said
    return { field, spokenField, description: answer.description.trim(), durationMs: read.durationMs, model: deps.model }
}
