import { normalizePath } from '../invokers/fieldPaths.ts'
import type { Assignment, DslValue, FieldAssignment, FieldValue, StepRef, WorkflowDsl, WorkflowStep } from './workflowDsl.schema.ts'

/** A loop as seen by later steps: what it iterates, in method terms when that is known. */
type LoopInfo = {
    id: string
    /** `over` rewritten onto a method step, or undefined when it iterates an array inside another loop's element. */
    methodOver: StepRef | undefined
    /** Identity of the iterated array (`s1:result`), shared by loops over the same list. */
    key: string | undefined
}

type Scope = {
    methods: Set<string>
    finishedLoops: Map<string, LoopInfo>
}

const isWholeElement = (path: string) => normalizePath(path) === ''

/**
 * Models also "fill" the parent of the fields they set (`ConfigItem = "{}"` beside `ConfigItem.Name`); written as a
 * string it would replace the object its children go into, so a parent of another assigned path is dropped.
 */
function withoutParentAssignments<T extends Assignment | FieldAssignment>(assignments: T[]): T[] {
    const names = assignments.map((assignment) => assignment.name)
    return assignments.filter(({ name }) => !names.some((other) => other !== name
        && (other.startsWith(`${name}.`) || other.startsWith(`${name}[]`))))
}

/**
 * Small models reuse a loop's id after the loop has ended: a second "for each object" loop iterating the first loop
 * (`over: { step: 's2' }`), and values reading `s2`'s element from inside it. The intent is unambiguous, so it is
 * rewritten instead of sent back for repair: the loop iterates the first loop's source array, and element reads move
 * to the enclosing loop over that same array. Anything else is left for `validateWorkflow` to report.
 */
export function normalizeWorkflow(dsl: WorkflowDsl): WorkflowDsl {
    const scope: Scope = { methods: new Set(), finishedLoops: new Map() }
    return { steps: normalizeSteps(dsl.steps, scope, []) }
}

function resolveOver(over: StepRef, scope: Scope, enclosing: LoopInfo[]): { over: StepRef; info: Omit<LoopInfo, 'id'> } {
    if (scope.methods.has(over.step)) {
        return { over, info: { methodOver: over, key: `${over.step}:${normalizePath(over.path)}` } }
    }
    const outer = enclosing.find((loop) => loop.id === over.step)
    if (outer) {
        const key = outer.key && `${outer.key}.${normalizePath(over.path)}`
        return { over, info: { methodOver: undefined, key } }
    }
    const finished = scope.finishedLoops.get(over.step)
    // `over: { step: 's2' }` or `{ step: 's2', path: 'result' }` with s2 itself over s1 › result: "the same list again".
    const isSameList = finished?.methodOver
        && (isWholeElement(over.path) || normalizePath(over.path) === normalizePath(finished.methodOver.path))
    if (finished?.methodOver && isSameList) {
        return { over: { ...finished.methodOver }, info: { methodOver: finished.methodOver, key: finished.key } }
    }
    return { over, info: { methodOver: undefined, key: undefined } }
}

/** A "// <field> from VAR_0=<path>" header copied from an example describes the example's inputs, not this script's. */
const COPIED_EXAMPLE_HEADER_RE = /^\s*\/\/.*\bVAR_\d+\s*=.*$/

function withoutCopiedHeaders(code: string): string {
    const lines = code.split('\n')
    while (lines.length > 1 && COPIED_EXAMPLE_HEADER_RE.test(lines[0] ?? '')) lines.shift()
    return lines.join('\n')
}

function normalizeFieldValue(value: FieldValue, scope: Scope, enclosing: LoopInfo[]): FieldValue {
    if (!('script' in value)) return normalizeValue(value, scope, enclosing)
    const inputs = value.script.inputs.map((input) => {
        const normalized = normalizeValue({ ref: input }, scope, enclosing)
        return 'ref' in normalized ? normalized.ref : input
    })
    return { script: { ...value.script, inputs, code: withoutCopiedHeaders(value.script.code) } }
}

function normalizeValue(value: DslValue, scope: Scope, enclosing: LoopInfo[]): DslValue {
    if (!('ref' in value)) return value
    const finished = scope.finishedLoops.get(value.ref.step)
    if (!finished?.key || enclosing.some((loop) => loop.id === value.ref.step)) return value
    const sameArray = [...enclosing].reverse().find((loop) => loop.key === finished.key)
    return sameArray ? { ref: { ...value.ref, step: sameArray.id } } : value
}

function normalizeSteps(steps: WorkflowStep[], scope: Scope, enclosing: LoopInfo[]): WorkflowStep[] {
    return steps.map((step): WorkflowStep => {
        const value = (input: DslValue) => normalizeValue(input, scope, enclosing)
        switch (step.kind) {
            case 'method': {
                const normalized = {
                    ...step,
                    params: step.params.map((param) => ({ ...param, value: value(param.value) })),
                    fields: withoutParentAssignments(step.fields)
                        .map((field) => ({ ...field, value: normalizeFieldValue(field.value, scope, enclosing) })),
                }
                scope.methods.add(step.id)
                return normalized
            }
            case 'if': {
                const condition = { ...step.condition, left: value(step.condition.left), right: value(step.condition.right) }
                return { ...step, condition, then: normalizeSteps(step.then, scope, enclosing) }
            }
            case 'loop': {
                const resolved = resolveOver(step.over, scope, enclosing)
                const info: LoopInfo = { id: step.id, ...resolved.info }
                const body = normalizeSteps(step.body, scope, [...enclosing, info])
                scope.finishedLoops.set(step.id, info)
                return { ...step, over: resolved.over, body }
            }
            default: {
                const _exhaustive: never = step
                return _exhaustive
            }
        }
    })
}
