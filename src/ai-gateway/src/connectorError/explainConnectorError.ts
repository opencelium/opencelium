import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { InvokerRepository } from '../invokers/invokerRepository.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { classifyConnectorError } from './classifyConnectorError.ts'

const MAX_ERROR = 3000

export const explainConnectorErrorRequestSchema = z.object({
    language: z.enum(['en', 'de']).default('en'),
    connector: z.string().max(300).default(''),
    /** The invoker name, to look up which settings the connector has and which call its test makes. */
    invoker: z.string().max(200).default(''),
    status: z.enum(['DOWN', 'AUTH_FAILED', 'UNKNOWN']),
    /** The stored last test error; long stack traces are cut. */
    error: z.string().max(100_000).default('').transform((text) => text.slice(0, MAX_ERROR)),
})

export type ExplainConnectorErrorRequest = z.infer<typeof explainConnectorErrorRequestSchema>

const answerSchema = z.object({
    summary: z.string().min(1),
    cause: z.string().min(1),
    /** Concrete things to check or change, most likely first. */
    checks: z.array(z.string().min(1)).min(1).max(5),
    /** Where the fix is: the connector's settings, the remote system (account, permissions, service) or the network. */
    fixIn: z.enum(['connector', 'remoteSystem', 'network']),
})

export type ConnectorErrorExplanation = z.infer<typeof answerSchema> & { kind: string; durationMs: number; model: string }

export type ExplainConnectorErrorDeps = { llm: LlmClient; model: string; contextTokens: number; invokers: InvokerRepository }

const SYSTEM_PROMPT = `You explain why an OpenCelium connector cannot connect to its system, for an administrator who
is not a developer. A connector holds the settings (URL, user, password, token, ...) and runs the invoker's test call.
Use the error text, the detected kind of failure and how the invoker connects. Name the setting to check by its name.
Settings with "{...}" in their default are templates the user fills in (e.g. https://{IP OR HOSTNAME}/...). Say when the
data does not show the cause instead of guessing. Never ask for secrets to be shared. Answer with JSON only.`

const answerFormat = toJsonSchema(answerSchema)

async function describe(request: ExplainConnectorErrorRequest, invokers: InvokerRepository): Promise<{ text: string; kind: string }> {
    const { kind, meaning } = classifyConnectorError(request.error, request.status)
    const setup = request.invoker ? (await invokers.get(request.invoker))?.setup : undefined
    const lines = [
        `Connector: ${request.connector || '(unnamed)'}${request.invoker ? ` (system: ${request.invoker})` : ''}`,
        `Status: ${request.status === 'AUTH_FAILED' ? 'reached, but authentication failed' : request.status === 'DOWN' ? 'could not be reached' : 'unknown'}`,
        `Error text: ${request.error || '(none stored)'}`,
        `Detected: ${meaning}`,
    ]
    if (setup) {
        lines.push(`Authentication: ${setup.authType || 'not stated'}`,
            `Settings: ${setup.settings.map((setting) => `${setting.name}${setting.value ? ` (default "${setting.value}")` : ''}`).join(', ')}`)
        if (setup.test) {
            const headers = setup.test.headers.map((header) => `${header.name}: ${header.value}`).join('; ')
            lines.push(`Test call: ${setup.test.method} ${setup.test.endpoint}${headers ? ` with headers ${headers}` : ''}`)
        }
    }
    lines.push(`Answer in ${request.language === 'de' ? 'German' : 'English'}.`)
    return { text: lines.join('\n'), kind }
}

export async function explainConnectorError(request: ExplainConnectorErrorRequest, deps: ExplainConnectorErrorDeps): Promise<ConnectorErrorExplanation> {
    const { text, kind } = await describe(request, deps.invokers)
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: text }],
        format: answerFormat,
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    let json: unknown
    try {
        json = JSON.parse(result.content)
    } catch {
        throw new Error('The model did not return a parseable explanation')
    }
    const parsed = answerSchema.safeParse(json)
    if (!parsed.success) throw new Error('The model did not return a usable explanation')
    return { ...parsed.data, kind, durationMs: result.durationMs, model: deps.model }
}
