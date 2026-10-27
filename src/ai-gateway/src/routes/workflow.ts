import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { AppDeps } from '../app.ts'
import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import { generatePlan } from '../plan/generatePlan.ts'
import { parsePlanText, renderPlanForBuild } from '../plan/renderPlanForBuild.ts'
import { type WorkflowConstraint, generateWorkflow } from '../workflow/generateWorkflow.ts'
import { type ScriptExamples, formatScriptExamples, noScriptExamples } from '../examples/scriptExamples.ts'
import { describeTemplateExamples, noTemplateFlows } from '../examples/templateFlows.ts'
import type { TemplateFlow } from '../examples/templateFlow.ts'
import { type OperationCall, type OperationExamples, describeOperationExamples, noOperationUsages } from '../examples/operationUsages.ts'
import { skeletonCalls, textCalls } from '../plan/planCalls.ts'
import { describeSkeleton, ruleKey } from '../plan/describeSkeleton.ts'
import { buildSkeleton, buildSkeletonSchema, scriptRules } from '../plan/planSkeleton.ts'
import { parseFieldRuleLine } from '../plan/planFieldRules.ts'
import type { PlanStep } from '../plan/workflowPlan.schema.ts'
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

type ParsedRequest = {
    /** The user's request alone; `prompt` may carry an unparsed plan after it. */
    task: string
    prompt: string
    connectors: WorkflowConnectors
    constraint?: WorkflowConstraint
    /** Distinct template scripts handed to the model as examples. */
    templateExampleCount: number
    useTemplates: boolean
    /** The operations the workflow will call, for the template usages of each. */
    calls: OperationCall[]
}

const EXAMPLES_PER_RULE = 2
// Whole templates are long; two cover "the same task elsewhere" without crowding the operation list out of the context.
const TEMPLATES_PER_PLAN = 2
// A reviewed plan already fixes the structure; one template is enough to show how its values are filled.
const TEMPLATES_PER_PLAN_BUILD = 1
const USAGES_PER_OPERATION = 2

const templateRefs = (flows: TemplateFlow[]) => flows.map(({ id, name }) => ({ id, name }))

/**
 * A plan that can't be read as steps still has its "set <field> = script: …" lines; their closest template scripts go
 * into the prompt, so templates help (and the switch shows a difference) for every plan, not only the parsed ones.
 */
async function examplesForPlanText(steps: PlanStep[], examples: ScriptExamples): Promise<{ text: string; count: number }> {
    const rules = steps.flatMap((step) => parseFieldRuleLine(step.text, [])?.rules.filter((rule) => rule.isScript) ?? [])
    const keys = [...new Set(rules.map(ruleKey))]
    const found = (await Promise.all(keys.map((key) => examples.find(key, EXAMPLES_PER_RULE)))).flat()
    const unique = [...new Map(found.map((example) => [example.code, example])).values()]
    if (unique.length === 0) return { text: '', count: 0 }
    return {
        text: `\n\nSimilar transformations already used in this installation (adapt them, don't copy their paths):\n${formatScriptExamples(unique)}`,
        count: unique.length,
    }
}

/**
 * The reviewed plan fixes the structure when it can be read as steps; otherwise it is passed on as explicit text.
 * Each script rule brings the most similar transformations from the installation's templates as examples.
 */
async function constraintFromPlan(prompt: string, planText: string, connectors: WorkflowConnectors,
    examples: ScriptExamples): Promise<{ prompt: string; constraint?: WorkflowConstraint; templateExampleCount: number; calls: OperationCall[] }> {
    const steps = parsePlanText(planText)
    let skeleton
    try {
        skeleton = buildSkeleton(steps, connectors)
    } catch {
        const fallback = await examplesForPlanText(steps, examples)
        return { prompt: `${prompt}\n\n${renderPlanForBuild(steps)}${fallback.text}`, templateExampleCount: fallback.count,
            calls: textCalls(steps.map((step) => step.text), connectors) }
    }
    const rules = scriptRules(skeleton)
    const found = await Promise.all(rules.map((rule) => examples.find(ruleKey(rule), EXAMPLES_PER_RULE)))
    const byRule = new Map(rules.map((rule, index) => [ruleKey(rule), found[index] ?? []]))
    const byField = new Map(rules.map((rule, index) => [rule.field, found[index] ?? []]))
    return {
        prompt,
        templateExampleCount: new Set(found.flat().map((example) => example.code)).size,
        calls: skeletonCalls(skeleton, connectors),
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
    if (!body.data.plan) return { task: prompt, prompt, connectors, templateExampleCount: 0, useTemplates, calls: textCalls([prompt], connectors) }
    const examplesToUse = useTemplates ? examples : noScriptExamples
    return { ...await constraintFromPlan(prompt, body.data.plan, connectors, examplesToUse), task: prompt, connectors, useTemplates }
}

function failGeneration(request: FastifyRequest, reply: FastifyReply, error: unknown, what: string) {
    request.log.error({ err: error }, `${what} failed`)
    const message = error instanceof Error ? error.message : `${what} failed`
    return sendApiError(reply, 'GENERATION_FAILED', message)
}

/** The request prompt, or the plan-fixed message, with the closest templates and the operations' template calls appended. */
function withTemplates(parsed: ParsedRequest, flows: TemplateFlow[], usages: OperationExamples[]): { prompt: string; constraint?: WorkflowConstraint } {
    const calls = describeOperationExamples(usages)
    if (flows.length === 0 && !calls) return parsed
    if (!parsed.constraint) {
        return { prompt: `${parsed.prompt}\n\n${describeTemplateExamples(flows, 'build', parsed.connectors)}${calls}`.trimEnd() }
    }
    const userMessage = `${parsed.constraint.userMessage}\n\n${describeTemplateExamples(flows, 'fill', parsed.connectors)}${calls}`.trimEnd()
    return { prompt: parsed.prompt, constraint: { ...parsed.constraint, userMessage } }
}

export function registerWorkflowRoutes(app: FastifyInstance, deps: AppDeps) {
    const { config, llm, templates = noTemplateFlows, operationUsages = noOperationUsages } = deps
    const findTemplates = (parsed: ParsedRequest, limit: number) =>
        parsed.useTemplates ? templates.find(parsed.task, parsed.connectors, limit) : Promise.resolve([])

    app.post('/workflow/plan', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        try {
            const flows = await findTemplates(parsed, TEMPLATES_PER_PLAN)
            const plan = await generatePlan(parsed.prompt, parsed.connectors, {
                llm, model: config.workflowModel, contextTokens: config.contextTokens, templates: flows,
            })
            request.log.info({ pattern: plan.pattern, stepCount: plan.steps.length, durationMs: plan.durationMs,
                templateIds: flows.map((flow) => flow.id) }, 'plan generated')
            return { ...plan, templates: templateRefs(flows) }
        } catch (error) {
            return failGeneration(request, reply, error, 'Plan generation')
        }
    })

    app.post('/workflow/generate', async (request, reply) => {
        const parsed = await parseRequest(request, reply, deps)
        if (!parsed) return reply
        const { connectors } = parsed
        try {
            const flows = await findTemplates(parsed, parsed.constraint ? TEMPLATES_PER_PLAN_BUILD : TEMPLATES_PER_PLAN)
            const usages = parsed.useTemplates ? await operationUsages.find(parsed.calls, USAGES_PER_OPERATION) : []
            const { prompt, constraint } = withTemplates(parsed, flows, usages)
            const result = await generateWorkflow(prompt, connectors, {
                llm,
                model: config.workflowModel,
                contextTokens: config.contextTokens,
                maxRepairAttempts: config.maxRepairAttempts,
            }, constraint)
            request.log.info(
                { from: connectors.from.name, to: connectors.to?.name, isPlanFixed: Boolean(constraint),
                    templateExampleCount: parsed.templateExampleCount, templateIds: flows.map((flow) => flow.id),
                    operationExampleCount: usages.length, attempts: result.attempts, issueCount: result.issues.length },
                'workflow generated',
            )
            return { ...result, templateExampleCount: parsed.templateExampleCount, templates: templateRefs(flows),
                operationExampleCount: usages.length }
        } catch (error) {
            return failGeneration(request, reply, error, 'Workflow generation')
        }
    })
}
