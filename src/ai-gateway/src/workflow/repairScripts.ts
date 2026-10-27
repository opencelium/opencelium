import { z } from 'zod'
import { type WorkflowConnectors, toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import { type WorkflowIssue, validateWorkflow } from '../dsl/validateWorkflow.ts'
import { type MethodStep, type WorkflowDsl, type WorkflowStep, scriptValueSchema } from '../dsl/workflowDsl.schema.ts'
import type { LlmClient } from '../llm/llmClient.ts'

export type ScriptRepairDeps = {
    llm: LlmClient
    model: string
    contextTokens: number
    maxRepairAttempts: number
    /** Example scripts for a field, from the installation's templates. */
    hints?: (field: string) => string
}

export type ScriptRepairAttempt = { promptTokens: number; outputTokens: number; durationMs: number; errorCount: number }

type BrokenScript = { stepId: string; field: string; problems: string[] }

const SCRIPT_ISSUE_RE = /^Field "(.+?)" script (.+)$/
const scriptOnly = scriptValueSchema.shape.script
const scriptFormat = toJsonSchema(scriptOnly)

/** Script errors grouped per field, or undefined when any error is not a script's (those need a whole-workflow repair). */
export function brokenScripts(issues: WorkflowIssue[]): BrokenScript[] | undefined {
    const byField = new Map<string, BrokenScript>()
    for (const issue of issues) {
        if (issue.severity !== 'error') continue
        const match = SCRIPT_ISSUE_RE.exec(issue.message)
        if (!match?.[1] || !match[2]) return undefined
        const key = `${issue.stepId}\u0000${match[1]}`
        const entry = byField.get(key) ?? { stepId: issue.stepId, field: match[1], problems: [] }
        entry.problems.push(match[2])
        byField.set(key, entry)
    }
    return [...byField.values()]
}

function findMethod(steps: WorkflowStep[], id: string): MethodStep | undefined {
    for (const step of steps) {
        if (step.kind === 'method' && step.id === id) return step
        const nested = step.kind === 'loop' ? step.body : step.kind === 'if' ? step.then : []
        const found = findMethod(nested, id)
        if (found) return found
    }
    return undefined
}

type ScopeEntry = { id: string; what: string }

/** What a step can read: earlier method steps on its path and the loops around it, closest loop first. */
function scopeOf(steps: WorkflowStep[], targetId: string, methods: ScopeEntry[] = [], loops: ScopeEntry[] = []): ScopeEntry[] | undefined {
    const visible = [...methods]
    for (const step of steps) {
        if (step.id === targetId) return [...[...loops].reverse(), ...[...visible].reverse()]
        if (step.kind === 'method') visible.push({ id: step.id, what: `method ${step.operation}: its response` })
        const loopEntry = step.kind === 'loop'
            ? [...loops, { id: step.id, what: `loop over ${step.over.step} › ${step.over.path}: the current element` }] : loops
        const nested = step.kind === 'loop' ? step.body : step.kind === 'if' ? step.then : []
        const found = scopeOf(nested, targetId, visible, loopEntry)
        if (found) return found
    }
    return undefined
}

function repairMessage(dsl: WorkflowDsl, broken: BrokenScript, method: MethodStep, hints: string): string {
    const current = method.fields.find((field) => field.name === broken.field)?.value
    const scope = scopeOf(dsl.steps, method.id) ?? []
    return `This workflow is fine except one transformation script. Fix only that script.

Workflow:
${JSON.stringify(dsl)}

Field "${broken.field}" of step ${method.id} (${method.operation}) has this script:
${JSON.stringify(current)}

Problems:
${broken.problems.map((problem) => `- ${problem}`).join('\n')}

Values this step can read (use them as inputs; the current element of a loop is usually the item being processed):
${scope.map((entry) => `- "${entry.id}": ${entry.what}`).join('\n')}
If the code uses a VAR_n that has no input, add the input it stands for (in order) rather than changing what the code does.
${hints ? `\nSimilar transformations already used in this installation:\n${hints}\n` : ''}
Return the corrected script as {"inputs":[...],"code":"...","description":"..."}. inputs[n] is VAR_n; every VAR_n the code
uses needs an input. An input is {"step":"<earlier method step id or enclosing loop id>","path":"<dot path>"}.
The code assigns RESULT_VAR and is ECMAScript 5.1 (var, function; no let/const/arrow functions/template strings).`
}

/**
 * Re-asks for each broken script alone. Regenerating the whole workflow for one bad script costs minutes and, at this
 * model size, tends to return the same answer; a single script is a short answer the model can focus on.
 */
export async function repairScripts(dsl: WorkflowDsl, broken: BrokenScript[], connectors: WorkflowConnectors,
    deps: ScriptRepairDeps): Promise<{ dsl: WorkflowDsl; issues: WorkflowIssue[]; attempts: ScriptRepairAttempt[] }> {
    const repaired = structuredClone(dsl)
    const attempts: ScriptRepairAttempt[] = []
    let issues = validateWorkflow(repaired, connectors)

    for (const target of broken) {
        let current = target
        for (let attempt = 0; attempt < deps.maxRepairAttempts; attempt++) {
            const method = findMethod(repaired.steps, current.stepId)
            const field = method?.fields.find((candidate) => candidate.name === current.field)
            if (!method || !field) break
            const result = await deps.llm.chat({
                model: deps.model,
                messages: [{ role: 'user', content: repairMessage(repaired, current, method, deps.hints?.(current.field) ?? '') }],
                format: scriptFormat,
                contextTokens: deps.contextTokens,
                temperature: attempt === 0 ? 0 : 0.4,
            })
            let parsed: z.infer<typeof scriptOnly> | undefined
            try {
                parsed = scriptOnly.parse(JSON.parse(result.content))
            } catch {
                parsed = undefined
            }
            if (parsed) field.value = { script: parsed }
            issues = validateWorkflow(repaired, connectors)
            const remaining = brokenScripts(issues)?.find((entry) => entry.stepId === current.stepId && entry.field === current.field)
            attempts.push({ promptTokens: result.promptTokens, outputTokens: result.outputTokens, durationMs: result.durationMs,
                errorCount: issues.filter((issue) => issue.severity === 'error').length })
            if (!remaining) break
            current = remaining
        }
    }
    return { dsl: repaired, issues, attempts }
}
