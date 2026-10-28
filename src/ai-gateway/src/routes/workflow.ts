import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { generatePlan } from '../plan/generatePlan.ts'
import { type WorkflowConstraint, generateWorkflow } from '../workflow/generateWorkflow.ts'
import { noScriptExamples } from '../examples/scriptExamples.ts'
import { describeTemplateExamples, noTemplateFlows } from '../examples/templateFlows.ts'
import type { TemplateFlow } from '../examples/templateFlow.ts'
import { type OperationExamples, describeOperationExamples, noOperationUsages } from '../examples/operationUsages.ts'
import { type FocusResult, focusConnectors, operationKey, restrictConnectors } from '../invokers/focusConnectors.ts'
import { textCalls } from '../plan/planCalls.ts'
import { type PlanBuild, constraintFromPlan } from '../workflow/planConstraint.ts'
import { sendApiError } from './apiError.ts'

export const generateWorkflowRequestSchema = z.object({
    prompt: z.string().trim().min(1).max(4000),
    from: z.string().trim().min(1),
    to: z.string().trim().min(1).optional(),
    /** The plan the user reviewed, one step per line with two-space indentation per level; it is built step by step. */
    plan: z.string().trim().min(1).max(6000).optional(),
    /** Off: build without the installation's template scripts as examples, e.g. to show what the model does alone. */
    useTemplates: z.boolean().default(true),
})

export type GenerateWorkflowRequest = z.infer<typeof generateWorkflowRequestSchema>

type ParsedRequest = PlanBuild & {
    /** The user's request alone; `prompt` may carry an unparsed plan after it. */
    task: string
    /** Both systems with all their operations; what the model is told about is narrowed by `focusFor`. */
    connectors: WorkflowConnectors
    useTemplates: boolean
}

// Whole templates are long; two cover "the same task elsewhere" without crowding the operation list out of the context.
const TEMPLATES_PER_PLAN = 2
// A reviewed plan already fixes the structure; one template is enough to show how its values are filled.
const TEMPLATES_PER_PLAN_BUILD = 1
const USAGES_PER_OPERATION = 2
// The operation descriptions get half the context; instructions, examples and the answer share the rest.
const CONNECTOR_BUDGET_SHARE = 0.5

const templateRefs = (flows: TemplateFlow[]) => flows.map(({ id, name }) => ({ id, name }))

/** Validates the body and resolves both invokers; on failure it has already replied and returns undefined. */
async function parseRequest(request: FastifyRequest, reply: FastifyReply, { invokers, examples = noScriptExamples }: AppDeps): Promise<ParsedRequest | undefined> {
    const body = generateWorkflowRequestSchema.safeParse(request.body)
    if (!body.success) {
        await sendApiError(reply, 'BAD_REQUEST', 'Invalid request body', z.treeifyError(body.error))
        return undefined
    }
    const { prompt, from: fromName, to: toName, useTemplates } = body.data
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
    const base = { task: prompt, connectors, useTemplates }
    if (!body.data.plan) return { ...base, prompt, templateExampleCount: 0, calls: textCalls([prompt], connectors) }
    const examplesToUse = useTemplates ? examples : noScriptExamples
    return { ...base, ...await constraintFromPlan(prompt, body.data.plan, connectors, examplesToUse) }
}

function failGeneration(request: FastifyRequest, reply: FastifyReply, error: unknown, what: string) {
    request.log.error({ err: error }, `${what} failed`)
    const message = error instanceof Error ? error.message : `${what} failed`
    return sendApiError(reply, 'GENERATION_FAILED', message)
}

/** The request prompt, or the plan-fixed message, with the closest templates and the operations' template calls appended. */
function withTemplates(parsed: ParsedRequest, connectors: WorkflowConnectors, flows: TemplateFlow[],
    usages: OperationExamples[]): { prompt: string; constraint?: WorkflowConstraint } {
    const calls = describeOperationExamples(usages)
    if (flows.length === 0 && !calls) return parsed
    if (!parsed.constraint) {
        return { prompt: `${parsed.prompt}\n\n${describeTemplateExamples(flows, 'build', connectors)}${calls}`.trimEnd() }
    }
    const userMessage = `${parsed.constraint.userMessage}\n\n${describeTemplateExamples(flows, 'fill', connectors)}${calls}`.trimEnd()
    return { prompt: parsed.prompt, constraint: { ...parsed.constraint, userMessage } }
}

export function registerWorkflowRoutes(app: FastifyInstance, deps: AppDeps) {
    const { config, llm, templates = noTemplateFlows, operationUsages = noOperationUsages, operationRanker } = deps
    const findTemplates = (parsed: ParsedRequest, limit: number) =>
        parsed.useTemplates ? templates.find(parsed.task, parsed.connectors, limit) : Promise.resolve([])

    /**
     * A plan-fixed build is told only about the operations its plan calls: the schema allows no others. Otherwise the
     * operations the request names and those the example templates call are kept, plus the closest ones that fit.
     */
    const focusFor = async (parsed: ParsedRequest, flows: TemplateFlow[]): Promise<FocusResult> => {
        const named = parsed.calls.map((call) => operationKey(call.side, call.operation))
        if (parsed.constraint) {
            const focused = restrictConnectors(parsed.connectors, new Set(named))
            const count = (connectors: WorkflowConnectors) => connectors.from.operations.length + (connectors.to?.operations.length ?? 0)
            return { connectors: focused, omittedCount: count(parsed.connectors) - count(focused), describedTokens: 0 }
        }
        const fromTemplates = flows.flatMap((flow) => [
            ...flow.operations.from.map((name) => operationKey('from', name)), ...flow.operations.to.map((name) => operationKey('to', name)),
        ])
        return focusConnectors(parsed.connectors, {
            text: parsed.prompt, required: new Set([...named, ...fromTemplates]),
            budgetTokens: Math.floor(config.contextTokens * CONNECTOR_BUDGET_SHARE),
        }, operationRanker)
    }

    app.post('/workflow/plan', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        try {
            const flows = await findTemplates(parsed, TEMPLATES_PER_PLAN)
            const focus = await focusFor(parsed, flows)
            const plan = await generatePlan(parsed.prompt, focus.connectors, {
                llm, model: config.workflowModel, contextTokens: config.contextTokens, templates: flows,
            })
            request.log.info({ pattern: plan.pattern, stepCount: plan.steps.length, durationMs: plan.durationMs,
                templateIds: flows.map((flow) => flow.id), omittedOperationCount: focus.omittedCount }, 'plan generated')
            return { ...plan, templates: templateRefs(flows) }
        } catch (error) {
            return failGeneration(request, reply, error, 'Plan generation')
        }
    })

    app.post('/workflow/generate', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        try {
            const flows = await findTemplates(parsed, parsed.constraint ? TEMPLATES_PER_PLAN_BUILD : TEMPLATES_PER_PLAN)
            const usages = parsed.useTemplates ? await operationUsages.find(parsed.calls, USAGES_PER_OPERATION) : []
            const { connectors, omittedCount } = await focusFor(parsed, flows)
            const { prompt, constraint } = withTemplates(parsed, connectors, flows, usages)
            const result = await generateWorkflow(prompt, connectors, {
                llm,
                model: config.workflowModel,
                contextTokens: config.contextTokens,
                maxRepairAttempts: config.maxRepairAttempts,
            }, constraint)
            request.log.info(
                { from: connectors.from.name, to: connectors.to?.name, isPlanFixed: Boolean(constraint),
                    templateExampleCount: parsed.templateExampleCount, templateIds: flows.map((flow) => flow.id),
                    operationExampleCount: usages.length, omittedOperationCount: omittedCount,
                    attempts: result.attempts, issueCount: result.issues.length },
                'workflow generated',
            )
            return { ...result, templateExampleCount: parsed.templateExampleCount, templates: templateRefs(flows),
                operationExampleCount: usages.length }
        } catch (error) {
            return failGeneration(request, reply, error, 'Workflow generation')
        }
    })
}
