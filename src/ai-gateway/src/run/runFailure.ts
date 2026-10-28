import { z } from 'zod'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'
import type { InvokerRepository } from '../invokers/invokerRepository.ts'
import { flattenFieldPaths } from '../invokers/fieldPaths.ts'
import { describeOperation } from '../workflow/buildWorkflowPrompt.ts'

// Response bodies can be megabytes; the start of one says what went wrong, the rest only crowds the context.
const MAX_PAYLOAD = 4000

const payload = z.string().max(200_000).optional().transform((text) => (text && text.length > MAX_PAYLOAD
    ? `${text.slice(0, MAX_PAYLOAD)}\n... (${text.length - MAX_PAYLOAD} more characters)` : text))

/** An earlier method of the workflow: what a reference `#<color>.(response)…` in the failing call points at. */
const earlierStepSchema = z.object({
    color: z.string().max(20),
    name: z.string().max(200),
    operation: z.string().max(200).default(''),
    system: z.string().max(200).default(''),
})

/** What a failed test run tells about the element where it failed; the frontend collects it from the live log. */
export const runFailureSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    workflowTitle: z.string().max(300).default(''),
    failure: z.object({
        kind: z.enum(['method', 'loop', 'if', 'execution']),
        message: z.string().max(4000),
        /** The step's name in the editor, or the operation name. */
        stepName: z.string().max(300).default(''),
        system: z.string().max(200).default(''),
        operation: z.string().max(200).default(''),
        /** Loops and ifs around the failing element, outermost first, as their expressions. */
        context: z.array(z.string().max(1000)).max(20).default([]),
        request: z.object({ method: z.string().max(20).default(''), url: z.string().max(4000).default(''), body: payload }).optional(),
        response: z.object({ status: z.string().max(20).default(''), body: payload }).optional(),
    }),
    /** The failing method as configured in the editor, references unresolved; present when it is a method. */
    step: z.object({ url: z.string().max(4000), body: z.string().max(20000) }).optional(),
    earlierSteps: z.array(earlierStepSchema).max(100).default([]),
})

export type RunFailure = z.infer<typeof runFailureSchema>

type DeclaredOperation = { invoker: Invoker; operation: InvokerOperation }

/** What the installed invokers declare for the failure: the failed operation, and what each earlier step returns. */
export type FailureContext = { declared?: DeclaredOperation; responses: Map<string, string> }

// The response paths of an earlier step are what a broken reference should have read; a few dozen show the shape.
const MAX_RESPONSE_PATHS = 30

async function findOperation(invokers: InvokerRepository, system: string, name: string): Promise<DeclaredOperation | undefined> {
    const invoker = system ? await invokers.get(system) : undefined
    const operation = invoker?.operations.find((candidate) => candidate.name === name)
    return invoker && operation ? { invoker, operation } : undefined
}

export async function loadFailureContext(failure: RunFailure, invokers: InvokerRepository): Promise<FailureContext> {
    const responses = new Map<string, string>()
    for (const step of failure.earlierSteps) {
        const found = await findOperation(invokers, step.system, step.operation)
        const paths = found ? flattenFieldPaths(found.operation.responseFields).slice(0, MAX_RESPONSE_PATHS).map((field) => field.path) : []
        if (paths.length) responses.set(step.color, paths.join(', '))
    }
    return { declared: await findOperation(invokers, failure.failure.system, failure.failure.operation), responses }
}

const languageName = (language: RunFailure['language']) => (language === 'de' ? 'German' : 'English')

/** The failure as the model reads it: what ran, what came back, and what the invoker declares for the operation. */
export function describeFailure(failure: RunFailure, { declared, responses }: FailureContext = { responses: new Map() }): string {
    const { failure: what, step, earlierSteps } = failure
    const lines = [
        `Workflow: ${failure.workflowTitle || '(untitled)'}`,
        `Failed element: ${what.kind}${what.stepName ? ` "${what.stepName}"` : ''}${what.operation ? ` (operation ${what.operation}` : ''}${what.system ? ` on ${what.system})` : what.operation ? ')' : ''}`,
        `Error: ${what.message || '(no message)'}`,
    ]
    if (what.context.length) lines.push(`Inside: ${what.context.join(' > ')}`)
    if (what.request) lines.push(`Request sent: ${what.request.method} ${what.request.url}`, `Request body sent:\n${what.request.body || '(none)'}`)
    if (what.response) lines.push(`Response: status ${what.response.status || '(none)'}`, `Response body:\n${what.response.body || '(none)'}`)
    if (step) lines.push(`The step as configured (references unresolved):\nURL: ${step.url}\nBody:\n${step.body || '(none)'}`)
    if (earlierSteps.length) {
        lines.push(`Earlier steps (a reference #<color>.(response)... reads one of their responses):\n${earlierSteps
            .map((earlier) => `- ${earlier.color}: ${earlier.name}${earlier.operation ? ` (${earlier.operation}${earlier.system ? ` on ${earlier.system}` : ''})` : ''}`
                + `${responses.has(earlier.color) ? `\n    its response declares: ${responses.get(earlier.color)}` : ''}`).join('\n')}`)
    }
    if (declared) lines.push(`What the ${declared.invoker.name} connector declares for this operation:\n${describeOperation(declared.operation, declared.invoker.requiredData)}`)
    return `${lines.join('\n')}\n\nAnswer in ${languageName(failure.language)}.`
}
