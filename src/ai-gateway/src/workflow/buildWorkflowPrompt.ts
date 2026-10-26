import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { WorkflowIssue } from '../dsl/validateWorkflow.ts'
import { flattenFieldPaths } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'

// Caps keep a large invoker inside the context window; the constrained schema still allows every field.
const MAX_BODY_PATHS = 40
const MAX_RESPONSE_PATHS = 40

function listPaths(fields: InvokerOperation['requestFields'], max: number): string {
    const paths = flattenFieldPaths(fields)
    if (paths.length === 0) return '-'
    const shown = paths.slice(0, max).map((field) => `${field.path}:${field.type}`)
    return paths.length > max ? `${shown.join(', ')}, ...` : shown.join(', ')
}

function describeOperation(operation: InvokerOperation): string {
    const params = operation.endpointParams.length ? operation.endpointParams.join(', ') : '-'
    return [
        `- ${operation.name}: ${operation.httpMethod} ${operation.endpoint}`,
        `    params: ${params}`,
        `    body: ${listPaths(operation.requestFields, MAX_BODY_PATHS)}`,
        `    response: ${listPaths(operation.responseFields, MAX_RESPONSE_PATHS)}`,
    ].join('\n')
}

function describeConnector(side: 'from' | 'to', invoker: Invoker): string {
    return `${invoker.name} operations (connector "${side}"):\n${invoker.operations.map(describeOperation).join('\n')}`
}

export function buildWorkflowSystemPrompt(connectors: WorkflowConnectors): string {
    const sections = [describeConnector('from', connectors.from)]
    if (connectors.to) sections.push(describeConnector('to', connectors.to))

    return `You design integration workflows for OpenCelium. Answer with JSON only.

A workflow is a tree of steps with ids s1, s2, s3, ... in document order:
- method: calls one operation on the connector that owns it. "params" fills endpoint placeholders, "fields" sets request body fields (dot paths).
- if: runs "then" only when the condition holds.
- loop: iterates over an array in an earlier method step's response ("over").

A value is one of:
  {"literal":"text"}
  {"ref":{"step":"<earlier method step id>","path":"<dot path in its response>"}}
  {"ref":{"step":"<enclosing loop id>","path":"<dot path inside the current array element>"}}

Rules:
- Use only the operations, params and body fields listed below.
- Connection settings (url, username, password, token) are configured on the connector; never set them.
- Inside a loop, read the current element through the loop's id; the path starts inside the element.
- Add only the steps the request needs.

${sections.join('\n\n')}`
}

export function buildRepairMessage(issues: WorkflowIssue[]): string {
    const lines = issues.map((issue) => `- ${issue.stepId ? `${issue.stepId}: ` : ''}${issue.message}`)
    return `The workflow has these problems:\n${lines.join('\n')}\nReturn the complete corrected workflow.`
}
