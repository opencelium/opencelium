import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'

/** The editor's loop operators: what each repeats over, and the kind of value it needs. */
export const LOOP_OPERATORS = {
    for: { meaning: 'repeat over the items of a list', takes: 'list' },
    forin: { meaning: "repeat over the fields (keys) of an object", takes: 'object' },
    SplitString: { meaning: 'split a text by a delimiter and repeat over the parts', takes: 'text' },
} as const

export type LoopOperator = keyof typeof LOOP_OPERATORS
export type LoopSourceKind = (typeof LOOP_OPERATORS)[LoopOperator]['takes']

export const suggestLoopRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    instruction: z.string().trim().min(1).max(1000),
    sources: z.array(z.object({
        id: z.string().min(1).max(20),
        step: z.string().max(300),
        system: z.string().max(200).default(''),
        /** `[*]` ends a list; `[i]` is the item a surrounding loop is at. */
        path: z.string().min(1).max(500),
        kind: z.enum(['list', 'object', 'text']),
    })).min(1).max(500),
})

export type SuggestLoopRequest = z.infer<typeof suggestLoopRequestSchema>

export type LoopSuggestion = {
    operator: LoopOperator
    source: string
    /** Only for SplitString. */
    delimiter: string
    explanation: string
    durationMs: number
    model: string
}

export type SuggestLoopDeps = { llm: LlmClient; model: string; contextTokens: number }

const SYSTEM_PROMPT = `You turn a plain-language description of a loop into the loop of an OpenCelium workflow step. A loop
repeats the steps inside it once per item of one value from an earlier step (by its source id).
- Pick the operator by what is repeated over; it must match the kind of the value (list, object or text).
- "For each issue" / "über alle Tickets": the list of those items. A list is preferred over a text or object when both fit.
- "delimiter": only for SplitString, the character the text is split by (default ","); empty otherwise.
- "explanation": one sentence saying what the loop repeats over, in the requested language.
Answer with JSON only.`

function describe(request: SuggestLoopRequest): string {
    const operators = Object.entries(LOOP_OPERATORS).map(([operator, { meaning, takes }]) => `- ${operator}: ${meaning} (needs a ${takes})`).join('\n')
    const sources = request.sources
        .map((source) => `- ${source.id} [${source.kind}]: ${source.step}${source.system ? ` (${source.system})` : ''} › ${source.path}`).join('\n')
    return `Loop: ${request.instruction}\n\nOperators:\n${operators}\n\nValues from earlier steps:\n${sources}\n\n`
        + `Write the explanation in ${request.language === 'de' ? 'German' : 'English'}.`
}

function answerSchema(request: SuggestLoopRequest) {
    const [first, ...rest] = request.sources.map((source) => source.id)
    return z.object({
        operator: z.enum(['for', 'forin', 'SplitString']),
        source: z.enum([first!, ...rest]),
        delimiter: z.string().max(10),
        explanation: z.string(),
    })
}

/** The operator the value's kind allows: the model may name a list and pick "forin", the value decides. */
const operatorFor = (kind: LoopSourceKind): LoopOperator =>
    (Object.keys(LOOP_OPERATORS) as LoopOperator[]).find((operator) => LOOP_OPERATORS[operator].takes === kind)!

/** "For each issue of SearchIssues": which value a loop repeats over, and how. */
export async function suggestLoop(request: SuggestLoopRequest, deps: SuggestLoopDeps): Promise<LoopSuggestion> {
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
        throw new Error('The model did not return a parseable loop')
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable loop')
    const source = request.sources.find((candidate) => candidate.id === parsed.data.source)!
    const operator = operatorFor(source.kind)
    const delimiter = operator === 'SplitString' ? parsed.data.delimiter || ',' : ''
    return { operator, source: source.id, delimiter, explanation: parsed.data.explanation, durationMs: result.durationMs, model: deps.model }
}
