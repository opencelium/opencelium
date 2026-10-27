import { type ScriptExample, formatScriptExamples } from '../examples/scriptExamples.ts'
import type { FieldRule } from './planFieldRules.ts'
import { type PlanSkeleton, type SkeletonNode, rulesFor, scriptRules } from './planSkeleton.ts'

/** Examples per script rule, keyed `<field> = <value>` as in `scriptRules`. */
export type RuleExamples = ReadonlyMap<string, ScriptExample[]>

export const ruleKey = (rule: FieldRule) => `${rule.field} = ${rule.value}`

function describeNode(skeleton: PlanSkeleton, node: SkeletonNode, depth: number): string[] {
    const pad = '  '.repeat(depth)
    const children = (nested: SkeletonNode[]) => nested.flatMap((child) => describeNode(skeleton, child, depth + 1))
    switch (node.kind) {
        case 'method': {
            const rules = rulesFor(skeleton, node.op.operation.name)
            return [`${pad}${node.id}: method ${node.op.operation.name} (connector "${node.op.side}") - ${node.text}`,
                ...rules.map((rule) => `${pad}    sets ${rule.field} = ${rule.value}`)]
        }
        case 'loop':
            return [`${pad}${node.id}: loop over the ${node.sourceOperation} result of ${node.sourceId} - ${node.text}`, ...children(node.body)]
        case 'if':
            return [`${pad}${node.id}: if - ${node.text}`, ...children(node.then)]
        default: {
            const _exhaustive: never = node
            return _exhaustive
        }
    }
}

function describeExamples(skeleton: PlanSkeleton, examples: RuleExamples): string {
    const sections = scriptRules(skeleton).flatMap((rule) => {
        const found = examples.get(ruleKey(rule)) ?? []
        return found.length ? [`For ${ruleKey(rule)}:\n${formatScriptExamples(found)}`] : []
    })
    return sections.length
        ? `\n\nSimilar transformations already used in this installation (adapt them, keep ECMAScript 5.1):\n${sections.join('\n\n')}`
        : ''
}

/** The user message for a skeleton build: the request, the fixed steps, their field rules and example scripts. */
export function describeSkeleton(request: string, skeleton: PlanSkeleton, examples: RuleExamples = new Map()): string {
    const notes = skeleton.notes.length ? `\n\nAlso apply:\n${skeleton.notes.map((note) => `- ${note}`).join('\n')}` : ''
    return `${request}

The workflow's steps are fixed (ids, nesting and operations below). Fill in only the values: each loop's "over.path"
(the list inside the source step's response), each if's condition, and each method's params and fields.
A field listed as "sets <field> = script: ..." must get a script value that does what the rule says; every other field
gets a plain value.
${skeleton.nodes.flatMap((node) => describeNode(skeleton, node, 0)).join('\n')}${notes}${describeExamples(skeleton, examples)}`
}
