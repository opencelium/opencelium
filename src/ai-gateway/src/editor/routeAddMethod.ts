import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { findSpokenMethod, isReferredTo, normalize } from '../guide/spokenNames.ts'
import type { Invoker } from '../invokers/invoker.types.ts'
import type { InvokerRepository } from '../invokers/invokerRepository.ts'
import type { OperationRanker } from '../invokers/focusConnectors.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { AddMethodRequest } from './addMethodRequest.schema.ts'
import { bestByWords, sharedWords, withoutWords } from './operationWords.ts'

export type AddMethodResult = {
    /** The connector to add from, or null when the request names none the user has. */
    connectorId: string | null
    /** The operation of that connector's invoker, or null when none matches what was said. */
    operation: string | null
    /** The method as the user said it, for telling them what could not be found. */
    spokenMethod: string
    position: 'after' | 'before'
    /** The step to add after or before; null when the request names none. */
    stepId: string | null
    durationMs: number
    model: string
}

export type RouteAddMethodDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
    invokers: InvokerRepository
    operationRanker?: OperationRanker
}

const NONE = 'none'
/** Operations offered to the model when the name was not spelled out; the rest are too far off to be meant. */
const CANDIDATE_COUNT = 15

function readMessage(request: AddMethodRequest, connectorKeys: string[], stepKeys: string[]): string {
    const connectors = request.connectors.map((connector, index) => `${connectorKeys[index]}: ${connector.title} (${connector.invoker})`).join('\n')
    const steps = request.steps.length ? request.steps.map((step, index) => `${stepKeys[index]}: ${step.label}`).join('\n') : '(none)'
    return `The user is building a workflow in OpenCelium and asks, in English or German, to add a new method (an API call)
from one of their connectors, possibly before or after a step of the workflow.

Connectors (name and system):
${connectors}

Steps of the workflow:
${steps}

Request: ${JSON.stringify(request.prompt)}

- "connector": the connector the request names, by its name or its system; "${NONE}" when it names none of them.
- "method": the method to add, as the user said it (e.g. "get all users"); never the step it goes before or after.
- "position": "before" for before/vor/davor, otherwise "after" (after/nach/hinter/danach, or nothing said).
- "step": the step the new method goes before or after; empty when the request names none ("after this one" names none).`
}

function pickMessage(spoken: string, prompt: string, candidates: string[]): string {
    return `Which of these API operations does the user mean by ${JSON.stringify(spoken)}?
Their whole request was: ${JSON.stringify(prompt)}

Operations:
${candidates.join('\n')}

Match the meaning, not single words. German requests: Objekt = object, Kategorie = category, Dienst = service,
löschen/entfernen = delete, lesen/holen/abrufen = read/get, anlegen/erstellen = create, ändern/aktualisieren = update,
suchen = search, alle = all/list.
Answer "${NONE}" when none of them is what was asked for.`
}

/** Operations closest in meaning, or by shared words without an embedding model. */
async function candidatesFor(spoken: string, invoker: Invoker, ranker: OperationRanker | undefined) {
    const operations = invoker.operations.map((operation) => operation.name)
    const scores = ranker ? await ranker.rank(invoker, spoken) : new Map<string, number>()
    const words = spoken.split(/[^\p{L}\p{N}]+/u).map(normalize).filter((word) => word.length >= 3)
    const overlap = (name: string) => words.filter((word) => normalize(name).includes(word)).length
    return [...operations]
        .sort((left, right) => (scores.get(right) ?? 0) - (scores.get(left) ?? 0) || overlap(right) - overlap(left))
        .slice(0, CANDIDATE_COUNT)
}

/**
 * An operation the request spells out exactly, wherever it says it: the model's own wording of the method can drift
 * ("cmdb object read" retold as "cmdb objects read"). The step's name is left out, since it is in the request too.
 */
function spelledOut(prompt: string, operations: string[], stepLabel: string | undefined): string {
    const said = normalize(prompt)
    const step = stepLabel ? normalize(stepLabel) : ''
    return operations
        .filter((operation) => normalize(operation).length >= 3 && normalize(operation) !== step && said.includes(normalize(operation)))
        .sort((left, right) => normalize(right).length - normalize(left).length)[0] ?? ''
}

/**
 * Reads "add <method> from <connector> after/before <step>": the connector and step from
 * the frontend's own lists, the operation from that connector's invoker — spelled-out
 * names directly, anything looser picked by the model from the closest operations.
 */
export async function routeAddMethod(request: AddMethodRequest, deps: RouteAddMethodDeps): Promise<AddMethodResult> {
    const connectorKeys = request.connectors.map((_, index) => `c${index + 1}`)
    const stepKeys = request.steps.map((_, index) => `s${index + 1}`)
    // Short keys keep the enums small and stop the model from echoing long names with typos.
    const readSchema = z.object({
        connector: z.enum([NONE, ...connectorKeys]),
        method: z.string(),
        position: z.enum(['after', 'before']),
        step: z.enum(['', ...stepKeys]),
    })
    const read = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: readMessage(request, connectorKeys, stepKeys) }],
        format: toJsonSchema(readSchema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = readSchema.parse(JSON.parse(read.content))
    const connector = request.connectors[connectorKeys.indexOf(answer.connector)]
    const step = request.steps[stepKeys.indexOf(answer.step)]
    const spokenMethod = answer.method.trim()
    let durationMs = read.durationMs

    let operation: string | null = null
    const invoker = connector ? await deps.invokers.get(connector.invoker) : undefined
    if (invoker && spokenMethod) {
        const operations = invoker.operations.map((item) => item.name)
        operation = spelledOut(request.prompt, operations, step?.label) || findSpokenMethod(spokenMethod, operations)
            || bestByWords(spokenMethod, operations) || null
        if (!operation) {
            const candidates = await candidatesFor(spokenMethod, invoker, deps.operationRanker)
            const pickSchema = z.object({ operation: z.enum([NONE, ...candidates]) })
            const pick = await deps.llm.chat({
                model: deps.model,
                messages: [{ role: 'user', content: pickMessage(spokenMethod, request.prompt, candidates) }],
                format: toJsonSchema(pickSchema),
                contextTokens: deps.contextTokens,
                temperature: 0,
            })
            durationMs += pick.durationMs
            const picked = pickSchema.parse(JSON.parse(pick.content)).operation
            // A constrained answer names something even for "send fax"; it has to share a word with what was said.
            operation = picked !== NONE && sharedWords(spokenMethod, picked) > 0 ? picked : null
        }
    }

    return {
        connectorId: connector?.id ?? null,
        operation,
        spokenMethod,
        position: answer.position,
        // A constrained answer has to name something; it only counts when the request refers to that step — outside the
        // words describing the new method, so "a method that reads all objects" is not placed by cmdb.objects.read.
        stepId: step && isReferredTo(step.label, withoutWords(request.prompt, spokenMethod)) ? step.id : null,
        durationMs,
        model: deps.model,
    }
}
