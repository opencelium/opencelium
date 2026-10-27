import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import type { CommandIndex } from './commandIndex.ts'
import { type CommandIntent, extractIntent, INTENT_COMMANDS } from './extractIntent.ts'
import type { CatalogCommand, RouteCommandRequest } from './commandRequest.schema.ts'

export type RouteCommandResult = {
    /** The chosen command's id, or null when none fits the request. */
    commandId: string | null
    /** What the model read the request as asking for; the command was corrected to match it. */
    action: Action
    /** The value for the command's `<placeholder>`, as the user wrote it; resolved to a real record by the frontend. */
    argument: string
    /** One short sentence for the user: what will happen, or why nothing fits. */
    reply: string
    /** For create commands: the form's values from the request (see `extractIntent`). */
    intent: CommandIntent | null
    candidates: string[]
    durationMs: number
    model: string
}

export type RouteCommandDeps = {
    llm: LlmClient
    index: CommandIndex
    model: string
    contextTokens: number
    /** Installed invoker names, for "create connector". */
    systems: () => Promise<string[]>
}

// Unthresholded: a request in German scores low against English commands, yet the model still reads it fine.
const CANDIDATE_COUNT = 12
const NONE = 'none'
/** The palette's entity verbs; everything else (theme, license, uploads) is "other". */
const ACTIONS = ['list', 'search', 'create', 'update', 'delete'] as const
type Action = (typeof ACTIONS)[number] | 'other'

const words = (command: CatalogCommand) => command.phrase.split(' ')
const actionOf = (command: CatalogCommand): Action => {
    const verb = words(command)[0] ?? ''
    return (ACTIONS as readonly string[]).includes(verb) ? (verb as Action) : 'other'
}

const fieldOf = (command: CatalogCommand) => {
    const parts = words(command)
    const by = parts.indexOf('by')
    return by >= 0 ? parts[by + 1] : undefined
}

/**
 * Several commands differ only in the field they look the record up by ("delete role by id" / "by name"); the model
 * picks among them at random. The value decides: a number goes to "by id", anything else to the other field.
 */
function withFittingField(chosen: CatalogCommand | undefined, argument: string, candidates: CatalogCommand[]): CatalogCommand | undefined {
    const field = chosen && fieldOf(chosen)
    if (!chosen || !field || !argument) return chosen
    const isNumber = /^\d+$/.test(argument.trim())
    if ((field === 'id') === isNumber) return chosen
    const [action, record] = words(chosen)
    return candidates.find((candidate) => {
        const [candidateAction, candidateRecord] = words(candidate)
        const candidateField = fieldOf(candidate)
        return candidateAction === action && candidateRecord === record && candidateField && (candidateField === 'id') === isNumber
    }) ?? chosen
}

/**
 * The small model names the action reliably but sometimes picks a neighbouring command of the same record ("search
 * user" for "delete the user"). The stated action wins: the command is swapped for the candidate with that action for
 * the same record, or, when the model found none, for the closest candidate with that action.
 */
function withStatedAction(
    chosen: CatalogCommand | undefined,
    action: Action,
    candidates: CatalogCommand[],
    catalog: CatalogCommand[],
): CatalogCommand | undefined {
    if (action === 'other') return chosen
    if (chosen && actionOf(chosen) === action) return chosen
    const record = chosen ? words(chosen)[1] : undefined
    const isMatch = (candidate: CatalogCommand) => actionOf(candidate) === action && (!record || words(candidate)[1] === record)
    // The shortlist is ranked by wording, so "run fake2 every 15 minutes" can leave "create schedule" out of it.
    return candidates.find(isMatch)
        ?? (record ? catalog.find(isMatch) : undefined)
        ?? (chosen ? chosen : candidates.find((candidate) => actionOf(candidate) === action))
}

// Only the section: a path like /user/update/2 carries an action word the small model copies instead of the request's.
const sectionOf = (page: string) => page.split(/[/?#]/).find(Boolean) ?? ''

function buildMessage(request: RouteCommandRequest, candidates: { key: string; command: CatalogCommand }[]): string {
    const section = sectionOf(request.page)
    const list = candidates.map(({ key, command }) => `${key}: ${command.phrase}: ${command.description}`).join('\n')
    return `You turn a request into one command of the OpenCelium command palette.

Commands (<...> marks the value the user gives):
${list}
${section ? `\nThe user is in the "${section}" section; use it only to tell what "this" or "it" means, never to pick the action or the kind of record.\n` : ''}
Request: ${JSON.stringify(request.prompt)}

First set "action" from what the request asks to do:
- delete or remove -> "delete"
- edit, change, rename, ändern or bearbeiten something that exists -> "update" (only then; naming a record is not editing it)
- open, show, view or find one named record -> "search"
- show or open all of a kind, or a list -> "list"
- add, new, create, anlegen or erstellen -> "create"
- run or start something on a timetable, i.e. at a time or interval ("every 15 minutes", "daily at 6", "jeden Montag")
  -> "create" a schedule; "for every new object" or "for each ticket" is not a timetable
- anything else (theme, license, upload, help, ...) -> "other"
Then pick the command with that action.
The kind of record must match as well; a record the request names wins ("create a workflow that ..." is a workflow): the request's word for it (English or German, e.g. "Rolle" is a role) against the
command's record and the names in its description, not what the value sounds like.
When it has a <value>, put into "argument" only that value as the user
wrote it (a name, title, email or id), without the command's words and without the kind of record ("schedule",
"user", ...); otherwise leave "argument" empty.
You do not need to know whether that record exists: it is looked up after you answer, so a name the user gives is enough.
"by <field>" only says where that name is searched (a schedule by its workflow's title): any name the user gives fits it.
Answer "${NONE}" only when no command has the asked action at all, and then say in "reply" what the palette can do instead.
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
    // "action" comes first: constrained decoding writes keys in order, so the model settles the action before the command.
    const answerSchema = z.object({
        action: z.enum([...ACTIONS, 'other']),
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
    const picked = candidates.find((candidate) => candidate.key === answer.command)?.command
    const offered = candidates.map((candidate) => candidate.command)
    // Only the closest commands reach the model, but a sibling lookup field may sit lower in the catalog.
    const chosen = withFittingField(withStatedAction(picked, answer.action, offered, request.commands), answer.argument, request.commands)
    const takesValue = Boolean(chosen && /<[^>]+>/.test(chosen.phrase))
    const intentKind = chosen ? INTENT_COMMANDS[chosen.phrase] : undefined
    const intent = intentKind
        ? await extractIntent(intentKind, request.prompt, { llm: deps.llm, model: deps.model, contextTokens: deps.contextTokens, systems: await deps.systems() })
            .catch(() => null)
        : null
    return {
        commandId: chosen?.id ?? null,
        action: answer.action,
        argument: takesValue ? answer.argument.trim() : '',
        // The reply describes the model's own pick; after a swap it would announce the wrong action.
        reply: chosen === picked ? answer.reply.trim() : '',
        intent,
        candidates: candidates.map((candidate) => candidate.command.id),
        durationMs: result.durationMs,
        model: deps.model,
    }
}
