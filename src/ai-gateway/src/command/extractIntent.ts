import { z } from 'zod'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { LlmClient } from '../llm/llmClient.ts'
import { scheduleTimingSchema, toQuartzCron } from './scheduleTiming.ts'

/**
 * Values for a create command, taken from the request so the form opens filled in. Names stay as the user said them;
 * the frontend matches them to real records. Nothing here is saved: the user reviews the form.
 */
export type CommandIntent =
    | { kind: 'schedule'; workflow: string; title: string; cronExp: string }
    | { kind: 'connector'; system: string; title: string; description: string }
    | { kind: 'workflow'; source: 'template' | 'ai' | 'empty'; template: string; from: string; to: string; title: string; task: string }

export type IntentKind = CommandIntent['kind']

/** The palette commands whose form this fills, by phrase. */
export const INTENT_COMMANDS: Record<string, IntentKind> = {
    'create schedule': 'schedule',
    'create connector': 'connector',
    'create workflow': 'workflow',
}

export type ExtractIntentDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
    /** Installed invoker names: a connector's system must be one of them. */
    systems: string[]
}

const scheduleSchema = z.object({ workflow: z.string(), title: z.string(), timing: scheduleTimingSchema })
const workflowSchema = z.object({
    source: z.enum(['template', 'ai', 'empty']),
    template: z.string(),
    from: z.string(),
    to: z.string(),
    title: z.string(),
    task: z.string(),
})

const RULES: Record<IntentKind, string> = {
    schedule: `Fill a new schedule (it runs an existing workflow on a timetable).
- "workflow": the workflow's name as said, e.g. "idoit to OTRS" ("für den Workflow config item" -> "config item"); empty
  only if no workflow was named.
- "title": a title if the user gave one, else empty.
- "timing": frequency minutes|hourly|daily|weekly|monthly ("unknown" if no timing was said); "every" is the interval
  (every 15 minutes -> 15, every 2 hours -> 2, else 1); "time" is HH:MM in 24 h (6 am -> 06:00, 6 pm -> 18:00) or empty;
  "weekdays" for weekly (MON..SUN, "weekdays"/"werktags" = MON-FRI); "dayOfMonth" 1-31 for monthly, else 0.`,
    connector: `Fill a new connector (a configured connection to one external system).
- "system": the system to connect to, exactly one of the listed systems, or empty if none fits.
- "title": a title if the user gave one, else empty. "description": empty unless the user described it.
Never put passwords, tokens or keys anywhere.`,
    workflow: `Fill a new workflow.
- "source": "template" when the user wants to start from a template, "ai" when they describe what it should do
  (sync, create, update... between systems), else "empty".
- "template": the template's name for "template", else empty.
- "from" / "to": the systems or connectors data comes from and goes to, as said (e.g. "i-doit", "OTRS"); empty if not said.
- "title": a title if the user gave one, else empty.
- "task": for "ai", what the workflow should do, in the user's words without the "create a workflow" part; else empty.`,
}

function schemaFor(kind: IntentKind, systems: string[]) {
    switch (kind) {
        case 'schedule':
            return scheduleSchema
        case 'connector':
            return z.object({ system: z.enum(['', ...systems]), title: z.string(), description: z.string() })
        case 'workflow':
            return workflowSchema
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}

/** A second, small question for create commands: the values the user gave for the form, in a fixed shape. */
export async function extractIntent(kind: IntentKind, prompt: string, deps: ExtractIntentDeps): Promise<CommandIntent> {
    const schema = schemaFor(kind, deps.systems)
    const systems = kind === 'connector' ? `\nSystems: ${deps.systems.join(', ')}\n` : ''
    const result = await deps.llm.chat({
        model: deps.model,
        messages: [{ role: 'user', content: `${RULES[kind]}\n${systems}\nRequest: ${JSON.stringify(prompt)}` }],
        format: toJsonSchema(schema),
        contextTokens: deps.contextTokens,
        temperature: 0,
    })
    const raw: unknown = JSON.parse(result.content)
    switch (kind) {
        case 'schedule': {
            const { workflow, title, timing } = scheduleSchema.parse(raw)
            return { kind, workflow: workflow.trim(), title: title.trim(), cronExp: toQuartzCron(timing) }
        }
        case 'connector': {
            const answer = z.object({ system: z.string(), title: z.string(), description: z.string() }).parse(raw)
            return { kind, system: deps.systems.includes(answer.system) ? answer.system : '', title: answer.title.trim(), description: answer.description.trim() }
        }
        case 'workflow': {
            const answer = workflowSchema.parse(raw)
            return { kind, ...answer, template: answer.template.trim(), from: answer.from.trim(), to: answer.to.trim(), title: answer.title.trim(), task: answer.task.trim() }
        }
        default: {
            const _exhaustive: never = kind
            return _exhaustive
        }
    }
}
