import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { generatePlan } from '../plan/generatePlan.ts'
import { parsePlanText, renderPlanForBuild } from '../plan/renderPlanForBuild.ts'
import { type WorkflowConstraint, generateWorkflow } from '../workflow/generateWorkflow.ts'
import { type ScriptExamples, formatScriptExamples, noScriptExamples } from '../examples/scriptExamples.ts'
import { describeSkeleton, ruleKey } from '../plan/describeSkeleton.ts'
import { buildSkeleton, buildSkeletonSchema, scriptRules } from '../plan/planSkeleton.ts'
import { sendApiError } from './apiError.ts'

export const generateWorkflowRequestSchema = z.object({
    prompt: z.string().trim().min(1).max(4000),
    from: z.string().trim().min(1),
    to: z.string().trim().min(1).optional(),
    /** The plan the user reviewed, one step per line with two-space indentation per level; it is built step by step. */
    plan: z.string().trim().min(1).max(6000).optional(),
})

export type GenerateWorkflowRequest = z.infer<typeof generateWorkflowRequestSchema>

type ParsedRequest = { prompt: string; connectors: WorkflowConnectors; constraint?: WorkflowConstraint }

const EXAMPLES_PER_RULE = 2

/**
 * The reviewed plan fixes the structure when it can be read as steps; otherwise it is passed on as explicit text.
 * Each script rule brings the most similar transformations from the installation's templates as examples.
 */
async function constraintFromPlan(prompt: string, planText: string, connectors: WorkflowConnectors,
    examples: ScriptExamples): Promise<{ prompt: string; constraint?: WorkflowConstraint }> {
    const steps = parsePlanText(planText)
    let skeleton
    try {
        skeleton = buildSkeleton(steps, connectors)
    } catch {
        return { prompt: `${prompt}\n\n${renderPlanForBuild(steps)}` }
    }
    const rules = scriptRules(skeleton)
    const found = await Promise.all(rules.map((rule) => examples.find(ruleKey(rule), EXAMPLES_PER_RULE)))
    const byRule = new Map(rules.map((rule, index) => [ruleKey(rule), found[index] ?? []]))
    const byField = new Map(rules.map((rule, index) => [rule.field, found[index] ?? []]))
    return {
        prompt,
        constraint: {
            schema: buildSkeletonSchema(skeleton),
            userMessage: describeSkeleton(prompt, skeleton, byRule),
            scriptHints: (field) => {
                const forField = byField.get(field) ?? []
                return forField.length ? formatScriptExamples(forField) : ''
            },
        },
    }
}

/** Validates the body and resolves both invokers; on failure it has already replied and returns undefined. */
async function parseRequest(request: FastifyRequest, reply: FastifyReply, { invokers, examples = noScriptExamples }: AppDeps): Promise<ParsedRequest | undefined> {
    const body = generateWorkflowRequestSchema.safeParse(request.body)
    if (!body.success) {
        await sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        return undefined
    }
    const { prompt, from: fromName, to: toName } = body.data
    const from = await invokers.get(fromName)
    if (!from) {
        await sendApiError(reply, 'UNKNOWN_INVOKER', `Unknown invoker "${fromName}"`)
        return undefined
    }
    const to = toName === undefined ? null : await invokers.get(toName)
    if (to === undefined) {
        await sendApiError(reply, 'UNKNOWN_INVOKER', `Unknown invoker "${toName}"`)
        return undefined
    }
    const connectors = { from, to }
    if (!body.data.plan) return { prompt, connectors }
    return { ...await constraintFromPlan(prompt, body.data.plan, connectors, examples), connectors }
}

function failGeneration(request: FastifyRequest, reply: FastifyReply, error: unknown, what: string) {
    request.log.error({ err: error }, `${what} failed`)
    const message = error instanceof Error ? error.message : `${what} failed`
    return sendApiError(reply, 'GENERATION_FAILED', message)
}

export function registerWorkflowRoutes(app: FastifyInstance, deps: AppDeps) {
    const { config, llm } = deps
    app.post('/workflow/plan', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        try {
            const plan = await generatePlan(parsed.prompt, parsed.connectors, {
                llm, model: config.workflowModel, contextTokens: config.contextTokens,
            })
            request.log.info({ pattern: plan.pattern, stepCount: plan.steps.length, durationMs: plan.durationMs }, 'plan generated')
            return plan
        } catch (error) {
            return failGeneration(request, reply, error, 'Plan generation')
        }
    })

    app.post('/workflow/generate', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        const { connectors } = parsed
        try {
            const result = await generateWorkflow(parsed.prompt, connectors, {
                llm,
                model: config.workflowModel,
                contextTokens: config.contextTokens,
                maxRepairAttempts: config.maxRepairAttempts,
            }, parsed.constraint)
            request.log.info(
                { from: connectors.from.name, to: connectors.to?.name, isPlanFixed: Boolean(parsed.constraint),
                    attempts: result.attempts, issueCount: result.issues.length },
                'workflow generated',
            )
            return result
        } catch (error) {
            return failGeneration(request, reply, error, 'Workflow generation')
        }
    })
}
