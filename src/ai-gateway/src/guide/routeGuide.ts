import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { RouteGuideRequest } from './guideRequest.schema.ts'
import { findSpokenMethod, isReferredTo } from './spokenNames.ts'

export type RouteGuideResult = {
    /** The guide to run, or null when the request asks for none of them. */
    guideId: string | null
    /** One of the request's method names, or empty when the request names none (the frontend then uses the selection). */
    method: string
    durationMs: number
    model: string
}

export type RouteGuideDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
}

const NONE = 'none'

// "How do I add …?", "Wie füge ich … hinzu?": asking how, not asking for it to be done. "Can you add …" is an instruction.
const HOW_QUESTION_RE = /^\s*(how|why|what|wie|warum|wozu|was)\b/i
// Asking to be shown or told, anywhere in the request: "show me how to …", "where do I …", "zeig mir, wie …".
const TEACH_ME_RE = /\b(how|where|why|what|show me|explain|teach|wie|wo|warum|was|zeig\w*|erklär\w*)\b/i

function buildMessage(request: RouteGuideRequest): string {
    const guides = request.guides.map((guide) => `${guide.id}: ${guide.description}`).join('\n')
    const methods = request.methods.length ? request.methods.join(', ') : '(none)'
    return `The user is building a workflow in OpenCelium and asks, in English or German, where to find something, how to
do it, or for something to be done in the workflow. Pick the option that answers it.

Options:
${guides}

Methods in the user's workflow: ${methods}

Request: ${JSON.stringify(request.prompt)}

- "guide": the option for what the request asks to see or do; "${NONE}" when none fits (e.g. it asks about
  something else entirely). Headers/Header/Kopfzeilen -> headers; URL/endpoint/Adresse -> url; body/payload/Inhalt ->
  body; try, test, send, run once, ausprobieren, testen -> try.
  An option that changes the workflow fits only an instruction to do it now ("add …", "apply … for X with …",
  "füge … hinzu"). A question how or where to do something ("how do I apply a transformation?") is the option that
  shows it step by step, if there is one, else "${NONE}" ("how do I add a method?" has none).
- "method": the existing method the request names, written exactly as in the list (a spoken "get customers" is
  "getCustomers"); empty when the request names none ("this method", "the method", "der Methode" name none).`
}

/** Reads a "where is …" request as one guide and, if named, one method of the open workflow. */
export async function routeGuide(request: RouteGuideRequest, deps: RouteGuideDeps): Promise<RouteGuideResult> {
    const methods = [...new Set(request.methods)]
    // "guide" first: constrained decoding writes keys in order, so the guide is settled before the method.
    const answerSchema = z.object({
        guide: z.enum([NONE, ...request.guides.map((guide) => guide.id)]),
        method: z.enum(['', ...methods]),
    })
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: buildMessage({ ...request, methods }) }],
        format: toJsonSchema(answerSchema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = answerSchema.parse(JSON.parse(result.content))
    const spoken = findSpokenMethod(request.prompt, methods)
    const picked = answer.method && isReferredTo(answer.method, request.prompt) ? answer.method : ''
    const chosen = request.guides.find((guide) => guide.id === answer.guide)
    // An option about the whole workflow stands for its per-method one when a method is named.
    const option = chosen?.withMethod && (spoken || picked)
        ? request.guides.find((guide) => guide.id === chosen.withMethod) ?? chosen : chosen
    // A how-question never runs an action: it gets the guide teaching that action, if there is one, else nothing. An
    // action that has such a guide also gives way to it when the request asks to be shown ("zeig mir den Body von X").
    const guideTeaching = option?.isAction ? request.guides.find((guide) => guide.teaches === option.id) : undefined
    const isRefused = option?.isAction === true
        && (HOW_QUESTION_RE.test(request.prompt) || (guideTeaching !== undefined && TEACH_ME_RE.test(request.prompt)))
    const teacher = isRefused ? guideTeaching : undefined
    // And the other way round: a guide chosen for an instruction that asks to be shown nothing ("transform X so …")
    // is the action it teaches.
    const taught = option?.teaches && !TEACH_ME_RE.test(request.prompt)
        ? request.guides.find((guide) => guide.id === option.teaches) : undefined
    return {
        guideId: teacher?.id ?? taught?.id ?? (!option || isRefused ? null : option.id),
        method: spoken || picked,
        durationMs: result.durationMs,
        model: deps.model,
    }
}
