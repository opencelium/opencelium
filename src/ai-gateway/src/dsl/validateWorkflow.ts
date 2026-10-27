import { flattenFieldPaths, normalizePath } from '../invokers/fieldPaths.ts'
import type { InvokerOperation } from '../invokers/invoker.types.ts'
import type { WorkflowConnectors } from './buildConstrainedSchema.ts'
import { checkScript } from './checkScript.ts'
import { type DslValue, type FieldValue, type LoopStep, type MethodStep, type StepRef, UNARY_CONDITION_OPS, type WorkflowDsl, type WorkflowStep } from './workflowDsl.schema.ts'

export type WorkflowIssue = {
    stepId: string
    /** Errors are fed back to the model for repair; warnings are returned to the user as-is. */
    severity: 'error' | 'warning'
    message: string
}

type Scope = {
    methods: Map<string, MethodStep>
    stepIds: Set<string>
    /** Loops whose body has been walked; a ref to one is out of scope, but names a list the model can loop over again. */
    finishedLoops: Map<string, LoopStep>
}

type Context = {
    connectors: WorkflowConnectors
    issues: WorkflowIssue[]
}

/** Where a ref's path is resolved: an operation's response, optionally below a prefix (the loop's array). */
type RefTarget = { operation: InvokerOperation | undefined; prefix: string }

function findOperation(connectors: WorkflowConnectors, step: MethodStep): InvokerOperation | undefined {
    const invoker = step.connector === 'from' ? connectors.from : connectors.to
    return invoker?.operations.find((operation) => operation.name === step.operation)
}

function joinPath(prefix: string, path: string): string {
    return prefix && path ? `${prefix}.${path}` : prefix || path
}

/** A ref names an earlier method step, or an enclosing loop whose array may itself come from an outer loop. */
function resolveTarget(ctx: Context, scope: Scope, loops: LoopStep[], stepId: string): RefTarget | undefined {
    const method = scope.methods.get(stepId)
    if (method) return { operation: findOperation(ctx.connectors, method), prefix: '' }
    const index = loops.findIndex((loop) => loop.id === stepId)
    const loop = loops[index]
    if (!loop) return undefined
    const source = resolveTarget(ctx, scope, loops.slice(0, index), loop.over.step)
    // A broken loop source is reported on the loop itself; refs through it stay valid but their paths go unchecked.
    if (!source) return { operation: undefined, prefix: '' }
    return { operation: source.operation, prefix: joinPath(source.prefix, loop.over.path) }
}

/** Says how to fix a ref to a loop that has ended: the repair prompt needs a concrete move, not just "out of scope". */
function describeUnresolvedRef(scope: Scope, what: string, ref: StepRef): string {
    const finished = scope.finishedLoops.get(ref.step)
    const source = finished && scope.methods.get(finished.over.step)
    if (!finished || !source) {
        return `${what} refers to "${ref.step}", which is neither an earlier method step nor an enclosing loop`
    }
    const over = JSON.stringify(finished.over)
    return `${what} refers to "${ref.step}", the loop over ${source.operation} › ${finished.over.path}, which has already ended. `
        + `To use one element of that list here, put these steps inside a new loop with "over": ${over} and refer to the new loop's id.`
}

function checkRef(ctx: Context, scope: Scope, loops: LoopStep[], stepId: string, ref: StepRef, what: string) {
    const target = resolveTarget(ctx, scope, loops, ref.step)
    if (!target) {
        ctx.issues.push({ stepId, severity: 'error', message: describeUnresolvedRef(scope, what, ref) })
        return
    }
    // Unknown paths are warnings, not errors: invoker response declarations are often incomplete.
    const declared = new Set(flattenFieldPaths(target.operation?.responseFields ?? []).map((f) => normalizePath(f.path)))
    const full = normalizePath(joinPath(target.prefix, ref.path))
    if (declared.size > 0 && full !== '' && !declared.has(full)) {
        ctx.issues.push({ stepId, severity: 'warning', message: `${what} path "${ref.path}" is not declared in the response` })
    }
}

function checkValue(ctx: Context, scope: Scope, loops: LoopStep[], stepId: string, value: DslValue, what: string) {
    if ('ref' in value) checkRef(ctx, scope, loops, stepId, value.ref, what)
}

const SCALAR_TYPES = new Set(['string', 'number', 'boolean', 'integer', 'int'])

/** The declared type of a ref's path, when the invoker declares it. */
function declaredType(ctx: Context, scope: Scope, loops: LoopStep[], ref: StepRef): { path: string; type: string } | undefined {
    const target = resolveTarget(ctx, scope, loops, ref.step)
    if (!target?.operation) return undefined
    const full = normalizePath(joinPath(target.prefix, ref.path))
    const field = flattenFieldPaths(target.operation.responseFields).find((candidate) => normalizePath(candidate.path) === full)
    return field && { path: ref.path, type: field.type }
}

/**
 * A script that reads a property of a scalar input (`VAR_0[i].ConfigItemID` where VAR_0 is a list of names) gets
 * undefined at run time. Calls (`VAR_0.split(',')`) and `length` are fine on strings.
 */
function scalarPropertyReads(code: string, inputs: StepRef[], typeOf: (ref: StepRef) => { path: string; type: string } | undefined): string[] {
    return inputs.flatMap((input, index) => {
        const declared = typeOf(input)
        if (!declared || !SCALAR_TYPES.has(declared.type)) return []
        const reads = [...code.matchAll(new RegExp(`\\bVAR_${index}\\s*(?:\\[[^\\]]*\\]\\s*)*\\.(\\w+)\\b(?!\\s*\\()`, 'g'))]
            .map((match) => match[1]).filter((property): property is string => !!property && property !== 'length')
        if (reads.length === 0) return []
        const items = declared.path.replace(/\.[^.[\]]+$/, '')
        return [`reads VAR_${index}.${reads[0]}, but input VAR_${index} (${declared.path}) holds ${declared.type} values, which have no `
            + `"${reads[0]}". To read fields of whole items, use the items as the input (path "${items}") and compare their fields in the code`]
    })
}

function checkFieldValue(ctx: Context, scope: Scope, loops: LoopStep[], stepId: string, value: FieldValue, what: string) {
    if (!('script' in value)) {
        checkValue(ctx, scope, loops, stepId, value, what)
        return
    }
    const { inputs, code } = value.script
    inputs.forEach((input, index) => checkRef(ctx, scope, loops, stepId, input, `${what} script input VAR_${index}`))
    const typeOf = (ref: StepRef) => declaredType(ctx, scope, loops, ref)
    for (const problem of [...checkScript(code, inputs.length), ...scalarPropertyReads(code, inputs, typeOf)]) {
        ctx.issues.push({ stepId, severity: 'error', message: `${what} script ${problem}` })
    }
}

function walk(ctx: Context, steps: WorkflowStep[], scope: Scope, loops: LoopStep[]) {
    for (const step of steps) {
        if (scope.stepIds.has(step.id)) {
            ctx.issues.push({ stepId: step.id, severity: 'error', message: `Step id "${step.id}" is used more than once` })
        }
        scope.stepIds.add(step.id)
        switch (step.kind) {
            case 'method':
                for (const param of step.params) checkValue(ctx, scope, loops, step.id, param.value, `Param "${param.name}"`)
                for (const field of step.fields) checkFieldValue(ctx, scope, loops, step.id, field.value, `Field "${field.name}"`)
                scope.methods.set(step.id, step)
                break
            case 'if':
                checkValue(ctx, scope, loops, step.id, step.condition.left, 'Condition left side')
                if (!UNARY_CONDITION_OPS.has(step.condition.op)) {
                    checkValue(ctx, scope, loops, step.id, step.condition.right, 'Condition right side')
                }
                walk(ctx, step.then, scope, loops)
                break
            case 'loop':
                checkRef(ctx, scope, loops, step.id, step.over, 'Loop source')
                walk(ctx, step.body, scope, [...loops, step])
                scope.finishedLoops.set(step.id, step)
                break
            default: {
                const _exhaustive: never = step
                return _exhaustive
            }
        }
    }
}

export function validateWorkflow(dsl: WorkflowDsl, connectors: WorkflowConnectors): WorkflowIssue[] {
    const ctx: Context = { connectors, issues: [] }
    walk(ctx, dsl.steps, { methods: new Map(), stepIds: new Set(), finishedLoops: new Map() }, [])
    return ctx.issues
}

export function hasErrors(issues: WorkflowIssue[]): boolean {
    return issues.some((issue) => issue.severity === 'error')
}
