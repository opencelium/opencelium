import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { OperationCall } from '../examples/operationUsages.ts'
import { type ScriptExamples, formatScriptExamples } from '../examples/scriptExamples.ts'
import { describeSkeleton, ruleKey } from '../plan/describeSkeleton.ts'
import { skeletonCalls, textCalls } from '../plan/planCalls.ts'
import { parseFieldRuleLine } from '../plan/planFieldRules.ts'
import { buildSkeleton, buildSkeletonSchema, scriptRules } from '../plan/planSkeleton.ts'
import { parsePlanText, renderPlanForBuild } from '../plan/renderPlanForBuild.ts'
import type { PlanStep } from '../plan/workflowPlan.schema.ts'
import type { WorkflowConstraint } from './generateWorkflow.ts'

const EXAMPLES_PER_RULE = 2

export type PlanBuild = {
    prompt: string
    /** Absent when the plan cannot be read as steps: it then travels as explicit text in `prompt`. */
    constraint?: WorkflowConstraint
    /** Distinct template scripts handed to the model as examples. */
    templateExampleCount: number
    /** The operations the workflow will call. */
    calls: OperationCall[]
}

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
export async function constraintFromPlan(prompt: string, planText: string, connectors: WorkflowConnectors,
    examples: ScriptExamples): Promise<PlanBuild> {
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
