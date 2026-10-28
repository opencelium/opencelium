import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'

/** What the body editor knows: the fields of the step being edited, and every value earlier steps can supply. */
export const suggestMappingRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    /** What the user wants this step to do, if they said; the field names alone usually suffice. */
    instruction: z.string().trim().max(1000).default(''),
    target: z.object({
        step: z.string().max(300),
        operation: z.string().max(200).default(''),
        system: z.string().max(200).default(''),
        fields: z.array(z.object({
            path: z.string().min(1).max(500),
            /** The field's value now: empty, fixed text or a reference. */
            current: z.string().max(500).default(''),
        })).min(1).max(150),
    }),
    sources: z.array(z.object({
        id: z.string().min(1).max(20),
        step: z.string().max(300),
        system: z.string().max(200).default(''),
        /** The path inside that step's response, with the array accessor already chosen ([i] in a loop, else [0]). */
        path: z.string().min(1).max(500),
    })).min(1).max(500),
})

export type SuggestMappingRequest = z.infer<typeof suggestMappingRequestSchema>

export type MappingSuggestion = { field: string; source: string; reason: string }

export type SuggestMappingResult = { suggestions: MappingSuggestion[]; durationMs: number; model: string }

export type SuggestMappingDeps = { llm: LlmClient; model: string; contextTokens: number }

const NONE = 'none'

const SYSTEM_PROMPT = `You map the request body fields of one step of an OpenCelium integration workflow to values from
earlier steps. For each field give the id of the source value that should fill it, or "none".
- Map by meaning: name/title/subject, mail/email, id/key/number of the same record, created/date, state/status.
- Prefer the record the step works on (the current loop item) over lists and other records.
- Use "none" when no source fits; a wrong value is worse than an empty field. Never map a field to an unrelated value
  just to fill it.
- The value is copied as it is. When the field needs a converted value (a status code where the field expects a state
  name such as "Operational", an id where it expects a name, a date in another format), answer "none": such a field
  needs a transformation script, not a copy.
- A field that is already set keeps its value unless the instruction asks otherwise: answer "none" for it.
- "reason" is a few words a user understands (e.g. "same meaning: title of the host").
Answer with JSON only.`

function describe(request: SuggestMappingRequest): string {
    const { target, sources, instruction } = request
    const fields = target.fields.map((field) => `- ${field.path}${field.current ? ` (already set: ${field.current})` : ''}`)
    const values = sources.map((source) => `- ${source.id}: ${source.step}${source.system ? ` (${source.system})` : ''} › ${source.path}`)
    return [
        `Step: ${target.step}${target.operation ? ` (operation ${target.operation}${target.system ? ` on ${target.system}` : ''})` : ''}`,
        instruction ? `Instruction: ${instruction}` : '',
        `Fields of its request body:\n${fields.join('\n')}`,
        `Values from earlier steps:\n${values.join('\n')}`,
        `Write each "reason" in ${request.language === 'de' ? 'German' : 'English'}.`,
    ].filter(Boolean).join('\n\n')
}

function answerSchema(request: SuggestMappingRequest) {
    const [firstField, ...fields] = request.target.fields.map((field) => field.path)
    const ids = request.sources.map((source) => source.id)
    return z.object({
        suggestions: z.array(z.object({
            field: z.enum([firstField!, ...fields]),
            source: z.enum([NONE, ...ids]),
            reason: z.string(),
        // Room for a field named twice; repeats are dropped afterwards.
        })).max(request.target.fields.length * 2),
    })
}

/**
 * Field mapping under a schema that lists only this step's fields and the given sources, so the model can neither invent
 * a field nor a reference; it only chooses. Fields it skips, maps to "none" or names twice are left out.
 */
export async function suggestMapping(request: SuggestMappingRequest, deps: SuggestMappingDeps): Promise<SuggestMappingResult> {
    const schema = answerSchema(request)
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: describe(request) }],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable mapping')
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable mapping')
    const alreadySet = new Set(request.target.fields.filter((field) => field.current.trim()).map((field) => field.path))
    const seen = new Set<string>()
    const suggestions = parsed.data.suggestions.filter((suggestion) => {
        if (suggestion.source === NONE || seen.has(suggestion.field)) return false
        seen.add(suggestion.field)
        return !(alreadySet.has(suggestion.field) && !request.instruction)
    })
    return { suggestions, durationMs: result.durationMs, model: deps.model }
}
