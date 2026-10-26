import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { generatePlan } from '../plan/generatePlan.ts'
import { parsePlanText, renderPlanForBuild } from '../plan/renderPlanForBuild.ts'
import { type WorkflowConstraint, generateWorkflow } from '../workflow/generateWorkflow.ts'
import { buildSkeleton, buildSkeletonSchema, describeSkeleton } from '../plan/planSkeleton.ts'
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

/** The reviewed plan fixes the structure when it can be read as steps; otherwise it is passed on as explicit text. */
function constraintFromPlan(prompt: string, planText: string, connectors: WorkflowConnectors): { prompt: string; constraint?: WorkflowConstraint } {
    const steps = parsePlanText(planText)
    try {
        const skeleton = buildSkeleton(steps, connectors)
        return { prompt, constraint: { schema: buildSkeletonSchema(skeleton), userMessage: describeSkeleton(prompt, skeleton) } }
    } catch {
        return { prompt: `${prompt}\n\n${renderPlanForBuild(steps)}` }
    }
}

/** Validates the body and resolves both invokers; on failure it has already replied and returns undefined. */
async function parseRequest(request: FastifyRequest, reply: FastifyReply, invokers: AppDeps['invokers']): Promise<ParsedRequest | undefined> {
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
    return { ...constraintFromPlan(prompt, body.data.plan, connectors), connectors }
}

function failGeneration(request: FastifyRequest, reply: FastifyReply, error: unknown, what: string) {
    request.log.error({ err: error }, `${what} failed`)
    const message = error instanceof Error ? error.message : `${what} failed`
    return sendApiError(reply, 'GENERATION_FAILED', message)
}

export function registerWorkflowRoutes(app: FastifyInstance, { config, llm, invokers }: AppDeps) {
    app.post('/workflow/plan', async (request, reply) => {
        const parsed = await parseRequest(request, reply, invokers)
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
        const parsed = await parseRequest(request, reply, invokers)
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
