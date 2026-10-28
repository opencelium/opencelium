import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'

/** The editor's if-operators, with what each tests, so the model picks by meaning. */
export const CONDITION_OPERATORS: Record<string, string> = {
    '=': 'equals the value',
    '!=': 'differs from the value',
    '>': 'is greater than the number',
    '>=': 'is greater than or equal to the number',
    '<': 'is less than the number',
    '<=': 'is less than or equal to the number',
    Contains: 'the list on the left holds the value',
    NotContains: 'the list on the left does not hold the value',
    ContainsSubStr: 'the text on the left contains the value as part of it',
    NotContainsSubStr: 'the text on the left does not contain the value',
    AllowList: 'is one of the comma-separated values',
    DenyList: 'is none of the comma-separated values',
    Like: 'matches the pattern (% as wildcard)',
    RegExp: 'matches the regular expression',
    IsEmpty: 'is empty (no value on the right)',
    NotEmpty: 'is not empty (no value on the right)',
    IsNull: 'is missing (no value on the right)',
    NotNull: 'is present (no value on the right)',
    PropertyExists: 'the object on the left has the property named on the right',
    PropertyNotExists: 'the object on the left lacks the property named on the right',
}

export const UNARY_OPERATORS = new Set(['IsEmpty', 'NotEmpty', 'IsNull', 'NotNull'])

export const suggestConditionRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    instruction: z.string().trim().min(1).max(1000),
    sources: z.array(z.object({
        id: z.string().min(1).max(20),
        step: z.string().max(300),
        system: z.string().max(200).default(''),
        /** `[i]` is the current loop item; `[*]` all items of a list. */
        path: z.string().min(1).max(500),
    })).min(1).max(500),
})

export type SuggestConditionRequest = z.infer<typeof suggestConditionRequestSchema>

export type SuggestedRule = { left: string; operator: string; right: { kind: 'none' } | { kind: 'value'; value: string } | { kind: 'source'; source: string } }

export type ConditionSuggestion = {
    conjunction: 'and' | 'or'
    not: boolean
    rules: SuggestedRule[]
    explanation: string
    durationMs: number
    model: string
}

export type SuggestConditionDeps = { llm: LlmClient; model: string; contextTokens: number }

const SYSTEM_PROMPT = `You turn a plain-language condition into rules for an OpenCelium workflow "if" step. Each rule
compares a value from an earlier step (by its source id) with a fixed value, another source, or nothing.
- Use the fewest rules that express the request; join them with "and" or "or". "not" negates the whole condition.
- Pick operators by meaning (listed below). For unary operators the right side is {"kind":"none"}.
- [i] is the item the surrounding loop is at; [*] means all items of a list, which suits Contains / NotContains
  ("the existing names contain this item's title": left = list with [*], right = source with [i]).
- Fixed values are written as the system stores them; for status-like fields keep the user's wording.
- "explanation": one sentence saying what the condition checks, in the requested language.
Answer with JSON only.`

function describe(request: SuggestConditionRequest): string {
    const operators = Object.entries(CONDITION_OPERATORS).map(([operator, meaning]) => `- ${operator}: ${meaning}`).join('\n')
    const sources = request.sources.map((source) => `- ${source.id}: ${source.step}${source.system ? ` (${source.system})` : ''} › ${source.path}`).join('\n')
    return `Condition: ${request.instruction}\n\nOperators:\n${operators}\n\nValues from earlier steps:\n${sources}\n\n`
        + `Write the explanation in ${request.language === 'de' ? 'German' : 'English'}.`
}

function answerSchema(request: SuggestConditionRequest) {
    const [first, ...rest] = request.sources.map((source) => source.id)
    const source = z.enum([first!, ...rest])
    const [firstOperator, ...operators] = Object.keys(CONDITION_OPERATORS)
    return z.object({
        conjunction: z.enum(['and', 'or']),
        not: z.boolean(),
        rules: z.array(z.object({
            left: source,
            operator: z.enum([firstOperator!, ...operators]),
            right: z.union([
                z.object({ kind: z.literal('none') }),
                z.object({ kind: z.literal('value'), value: z.string() }),
                z.object({ kind: z.literal('source'), source }),
            ]),
        })).min(1).max(8),
        explanation: z.string(),
    })
}

/** Unary operators carry no right side; a comparison without one is left out. */
function tidy(rules: SuggestedRule[]): SuggestedRule[] {
    return rules.flatMap((rule): SuggestedRule[] => {
        if (UNARY_OPERATORS.has(rule.operator)) return [{ ...rule, right: { kind: 'none' } }]
        return rule.right.kind === 'none' ? [] : [rule]
    })
}

export async function suggestCondition(request: SuggestConditionRequest, deps: SuggestConditionDeps): Promise<ConditionSuggestion> {
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
        throw new Error('The model did not return a parseable condition')
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable condition')
    const rules = tidy(parsed.data.rules as SuggestedRule[])
    if (rules.length === 0) throw new Error('The model did not return a usable condition')
    return { ...parsed.data, rules, durationMs: result.durationMs, model: deps.model }
}
