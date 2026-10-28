import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { normalizeWorkflow } from '../dsl/normalizeWorkflow.ts'
import { type WorkflowIssue, validateWorkflow } from '../dsl/validateWorkflow.ts'
import { toJsonSchema } from '../dsl/buildConstrainedSchema.ts'
import type { ChatMessage } from '../llm/llmClient.ts'
import type { PlanSkeleton, SkeletonNode } from '../plan/planSkeleton.ts'
import { type StepFill, assembleSkeleton, buildChunkSchema, chunkSkeleton } from '../plan/skeletonChunks.ts'
import { buildWorkflowSystemPrompt } from './buildWorkflowPrompt.ts'
import type { GenerateWorkflowDeps, GenerateWorkflowResult, GenerationAttempt, WorkflowConstraint } from './generateWorkflow.ts'
import { brokenScripts, repairScripts } from './repairScripts.ts'

// Small enough that one answer stays well inside the time limit on a laptop GPU, large enough that a loop and the
// steps right inside it usually share an answer.
export const STEPS_PER_ANSWER = 6
// What earlier answers filled is shown for consistency (the same loop path, the same match field); long values only
// cost prompt time.
const MAX_FILLED_LINE = 400

const errorCount = (issues: WorkflowIssue[]) => issues.filter((issue) => issue.severity === 'error').length

function describeNode(node: SkeletonNode): string {
    switch (node.kind) {
        case 'method': return `${node.id} (method ${node.op.operation.name})`
        case 'loop': return `${node.id} (loop over the ${node.sourceOperation} result of ${node.sourceId}: fill "over.path")`
        case 'if': return `${node.id} (if: fill "condition")`
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

const filledLine = (fill: StepFill) => {
    const text = JSON.stringify(fill)
    return text.length > MAX_FILLED_LINE ? `${text.slice(0, MAX_FILLED_LINE)}…` : text
}

/**
 * The message for one chunk. Everything before "Fill now" is the same for every chunk of a build (plan, rules,
 * examples), so Ollama reuses the evaluated prompt and each chunk costs little more than its own answer.
 */
function chunkMessage(userMessage: string, chunk: SkeletonNode[], filled: StepFill[], issues: WorkflowIssue[]): string {
    const earlier = filled.length ? `\n\nAlready filled (keep consistent with these):\n${filled.map(filledLine).join('\n')}` : ''
    const problems = issues.length
        ? `\n\nThe previous answer for these steps had problems; fix them:\n${issues.map((issue) => `- ${issue.stepId}: ${issue.message}`).join('\n')}`
        : ''
    return `${userMessage}${earlier}\n\nFill now only these steps, in this order: ${chunk.map(describeNode).join(', ')}.${problems}\n`
        + 'Answer {"steps":[...]} with exactly these steps; the steps inside a loop or if are filled separately.'
}

type ChunkAnswer = { fills: StepFill[]; attempt: GenerationAttempt }

async function fillChunk(skeleton: PlanSkeleton, chunk: SkeletonNode[], systemPrompt: string, userMessage: string,
    filled: StepFill[], issues: WorkflowIssue[], deps: GenerateWorkflowDeps): Promise<ChunkAnswer | undefined> {
    const schema = buildChunkSchema(skeleton, chunk)
    const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, { role: 'user', content: chunkMessage(userMessage, chunk, filled, issues) }]
    const result = await deps.llm.chat({ model: deps.model, messages, format: toJsonSchema(schema), contextTokens: deps.contextTokens,
        temperature: issues.length ? 0.4 : 0 })
    const attempt = { promptTokens: result.promptTokens, outputTokens: result.outputTokens, durationMs: result.durationMs, errorCount: 0 }
    try {
        const parsed = schema.safeParse(JSON.parse(result.content))
        return parsed.success ? { fills: parsed.data.steps, attempt } : undefined
    } catch {
        return undefined
    }
}

/**
 * A plan-fixed build in several short answers instead of one long one: a large workflow written in one answer runs past
 * the time limit. Each chunk fills a few steps; the pieces are assembled, validated as a whole, and only the chunks
 * holding errors are asked again, then broken scripts are repaired one by one as in a single-answer build.
 */
export async function generateInChunks(skeleton: PlanSkeleton, connectors: WorkflowConnectors, deps: GenerateWorkflowDeps,
    constraint: WorkflowConstraint): Promise<GenerateWorkflowResult> {
    const systemPrompt = buildWorkflowSystemPrompt(connectors)
    const chunks = chunkSkeleton(skeleton, STEPS_PER_ANSWER)
    const fills = new Map<string, StepFill>()
    const attempts: GenerationAttempt[] = []

    const runChunk = async (chunk: SkeletonNode[], issues: WorkflowIssue[]) => {
        const ids = new Set(chunk.map((node) => node.id))
        const earlier = [...fills.values()].filter((fill) => !ids.has(fill.id))
        // One retry: under constrained decoding a malformed answer is rare, and the next one usually parses.
        for (let tries = 0; tries < 2; tries++) {
            const answer = await fillChunk(skeleton, chunk, systemPrompt, constraint.userMessage, earlier, issues, deps)
            if (!answer) continue
            attempts.push(answer.attempt)
            answer.fills.forEach((fill) => fills.set(fill.id, fill))
            return
        }
        throw new Error(`The model did not return usable values for steps ${[...ids].join(', ')}`)
    }

    for (const chunk of chunks) await runChunk(chunk, [])
    const assemble = () => {
        const dsl = assembleSkeleton(skeleton, fills)
        if (!dsl) throw new Error('The workflow could not be assembled from its parts')
        const normalized = normalizeWorkflow(dsl)
        return { dsl: normalized, issues: validateWorkflow(normalized, connectors) }
    }
    let { dsl, issues } = assemble()

    for (let round = 0; round < deps.maxRepairAttempts && errorCount(issues) > 0; round++) {
        const scripts = brokenScripts(issues)
        if (scripts?.length) break
        const faulty = chunks.filter((chunk) => chunk.some((node) => issues.some((issue) => issue.severity === 'error' && issue.stepId === node.id)))
        if (faulty.length === 0) break
        for (const chunk of faulty) {
            const own = issues.filter((issue) => issue.severity === 'error' && chunk.some((node) => node.id === issue.stepId))
            await runChunk(chunk, own)
        }
        const next = assemble()
        if (errorCount(next.issues) <= errorCount(issues)) ({ dsl, issues } = next)
    }

    const scripts = brokenScripts(issues)
    if (scripts?.length) {
        const repaired = await repairScripts(dsl, scripts, connectors, { ...deps, hints: constraint.scriptHints })
        attempts.push(...repaired.attempts)
        if (errorCount(repaired.issues) <= errorCount(issues)) ({ dsl, issues } = repaired)
    }
    attempts.forEach((attempt) => { attempt.errorCount = errorCount(issues) })
    return { dsl, issues, attempts, model: deps.model }
}
