import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { findSpokenMethod } from '../guide/spokenNames.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { OperatorRequest } from './operatorRequest.schema.ts'

export type OperatorKind = 'if' | 'loop'

export type OperatorIntentResult = {
    kind: OperatorKind
    position: 'after' | 'before'
    /** The step to add after or before; null when the request names none. */
    stepId: string | null
    /** The condition, or what to loop over, as the user said it; empty when the request says nothing about it. */
    condition: string
    durationMs: number
    model: string
}

export type RouteOperatorDeps = { llm: LlmClient; model: string; contextTokens: number }

// Said outright, the operator's name settles its kind whatever the model read.
const LOOP_RE = /\b(loop|schleife|for[ -]each|für jede[nrms]?|iterate|iteriere\w*)\b/i
const IF_RE = /\b(an if|if[ -]step|if[ -]operator|condition|bedingung|verzweigung|branch|ein if|einen if)\b/i
const BEFORE_RE = /\b(before|vor|davor)\b/i

function readMessage(request: OperatorRequest, keys: string[]): string {
    const steps = request.steps.length ? request.steps.map((step, index) => `${keys[index]}: ${step.label}`).join('\n') : '(none)'
    return `The user is building a workflow in OpenCelium and asks, in English or German, to add an operator: an "if" (a
step that runs what follows only when a condition holds) or a "loop" (repeats what follows for every item of a list).

Steps of the workflow:
${steps}

Request: ${JSON.stringify(request.prompt)}

- "kind": "loop" for a loop / for each / Schleife / für jedes, "if" for an if / condition / when / only if / wenn / falls.
- "position": "before" for before/vor/davor, otherwise "after".
- "step": the step the operator goes before or after; empty when the request names none.
- "condition": copied from the request in its own words and language, without the step and without the words that ask
  for the operator: for an if the condition, for a loop the list to loop over; empty when the request says nothing.`
}

/** Reads "add an if after X when …" / "loop over the issues of X": the kind, where it goes, and its condition in words. */
export async function routeOperator(request: OperatorRequest, deps: RouteOperatorDeps): Promise<OperatorIntentResult> {
    const keys = request.steps.map((_, index) => `s${index + 1}`)
    const schema = z.object({
        kind: z.enum(['if', 'loop']),
        position: z.enum(['after', 'before']),
        // Asked for so the model keeps the step out of the condition; the step itself is taken only when spelled out.
        step: z.enum(['', ...keys]),
        condition: z.string(),
    })
    const read = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: readMessage(request, keys) }],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = schema.parse(JSON.parse(read.content))
    const isLoopSaid = LOOP_RE.test(request.prompt)
    const isIfSaid = IF_RE.test(request.prompt)
    const kind: OperatorKind = isLoopSaid && !isIfSaid ? 'loop' : isIfSaid && !isLoopSaid ? 'if' : answer.kind
    const labels = request.steps.map((step) => step.label)
    // Only a step the request spells out: a single shared word ("for each issue", "the config item") names none, and an
    // unnamed step falls back to the selected one in the editor.
    const spelled = findSpokenMethod(request.prompt, labels)
    const step = spelled ? request.steps.find((item) => item.label === spelled) : undefined
    return {
        kind,
        position: step && BEFORE_RE.test(request.prompt) ? 'before' : 'after',
        stepId: step?.id ?? null,
        condition: answer.condition.trim(),
        durationMs: read.durationMs,
        model: deps.model,
    }
}
