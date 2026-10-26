import { flattenFieldPaths, normalizePath } from '../invokers/fieldPaths.ts'
import type { InvokerOperation } from '../invokers/invoker.types.ts'
import type { WorkflowConnectors } from './buildConstrainedSchema.ts'
import type { DslValue, LoopStep, MethodStep, StepRef, WorkflowDsl, WorkflowStep } from './workflowDsl.schema.ts'

export type WorkflowIssue = {
    stepId: string
    /** Errors are fed back to the model for repair; warnings are returned to the user as-is. */
    severity: 'error' | 'warning'
    message: string
}

type Scope = {
    methods: Map<string, MethodStep>
    stepIds: Set<string>
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

function checkRef(ctx: Context, scope: Scope, loops: LoopStep[], stepId: string, ref: StepRef, what: string) {
    const target = resolveTarget(ctx, scope, loops, ref.step)
    if (!target) {
        ctx.issues.push({
            stepId,
            severity: 'error',
            message: `${what} refers to "${ref.step}", which is neither an earlier method step nor an enclosing loop`,
        })
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

function walk(ctx: Context, steps: WorkflowStep[], scope: Scope, loops: LoopStep[]) {
    for (const step of steps) {
        if (scope.stepIds.has(step.id)) {
            ctx.issues.push({ stepId: step.id, severity: 'error', message: `Step id "${step.id}" is used more than once` })
        }
        scope.stepIds.add(step.id)
        switch (step.kind) {
            case 'method':
                for (const param of step.params) checkValue(ctx, scope, loops, step.id, param.value, `Param "${param.name}"`)
                for (const field of step.fields) checkValue(ctx, scope, loops, step.id, field.value, `Field "${field.name}"`)
                scope.methods.set(step.id, step)
                break
            case 'if':
                checkValue(ctx, scope, loops, step.id, step.condition.left, 'Condition left side')
                checkValue(ctx, scope, loops, step.id, step.condition.right, 'Condition right side')
                walk(ctx, step.then, scope, loops)
                break
            case 'loop':
                checkRef(ctx, scope, loops, step.id, step.over, 'Loop source')
                walk(ctx, step.body, scope, [...loops, step])
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
    walk(ctx, dsl.steps, { methods: new Map(), stepIds: new Set() }, [])
    return ctx.issues
}

export function hasErrors(issues: WorkflowIssue[]): boolean {
    return issues.some((issue) => issue.severity === 'error')
}
