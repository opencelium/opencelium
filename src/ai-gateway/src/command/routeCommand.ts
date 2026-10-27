import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { CommandIndex } from './commandIndex.ts'
import type { CatalogCommand, RouteCommandRequest } from './commandRequest.schema.ts'

export type RouteCommandResult = {
    /** The chosen command's id, or null when none fits the request. */
    commandId: string | null
    /** The value for the command's `<placeholder>`, as the user wrote it; resolved to a real record by the frontend. */
    argument: string
    /** One short sentence for the user: what will happen, or why nothing fits. */
    reply: string
    candidates: string[]
    durationMs: number
    model: string
}

export type RouteCommandDeps = {
    llm: LlmClient
    index: CommandIndex
    model: string
    contextTokens: number
}

// Unthresholded: a request in German scores low against English commands, yet the model still reads it fine.
const CANDIDATE_COUNT = 12
const NONE = 'none'

function buildMessage(request: RouteCommandRequest, candidates: { key: string; command: CatalogCommand }[]): string {
    const list = candidates.map(({ key, command }) => `${key}: ${command.phrase}: ${command.description}`).join('\n')
    return `You turn a request into one command of the OpenCelium command palette.

Commands (<...> marks the value the user gives):
${list}
${request.page ? `\nThe user is on the page ${request.page}.\n` : ''}
Request: ${JSON.stringify(request.prompt)}

Pick the command that does what the request asks. When it has a <value>, put into "argument" only that value as the user
wrote it (a name, title, email or id), without the command's words and without the kind of record ("schedule",
"user", ...); otherwise leave "argument" empty.
If no command fits, answer "${NONE}" and say in "reply" what the palette can do instead.
"reply" is one short sentence in ${request.language === 'de' ? 'German' : 'English'} saying what will happen.`
}

/** Narrows the catalog by meaning, then lets the model pick one command and the value it needs. */
export async function routeCommand(request: RouteCommandRequest, deps: RouteCommandDeps): Promise<RouteCommandResult> {
    const ranked = await deps.index.rank(request.prompt, request.commands, CANDIDATE_COUNT, { isThresholded: false })
    const byId = new Map(request.commands.map((command) => [command.id, command]))
    // Short keys keep the enum small and stop the model from echoing long phrases with typos.
    const candidates = ranked.map((entry) => entry.id)
        .flatMap((id, position) => {
            const command = byId.get(id)
            return command ? [{ key: `c${position + 1}`, command }] : []
        })
    const answerSchema = z.object({
        command: z.enum([NONE, ...candidates.map((candidate) => candidate.key)]),
        argument: z.string(),
        reply: z.string(),
    })
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: buildMessage(request, candidates) }],
        format: toJsonSchema(answerSchema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const answer = answerSchema.parse(JSON.parse(result.content))
    const chosen = candidates.find((candidate) => candidate.key === answer.command)?.command
    const takesValue = Boolean(chosen && /<[^>]+>/.test(chosen.phrase))
    return {
        commandId: chosen?.id ?? null,
        argument: takesValue ? answer.argument.trim() : '',
        reply: answer.reply.trim(),
        candidates: candidates.map((candidate) => candidate.command.id),
        durationMs: result.durationMs,
        model: deps.model,
    }
}
