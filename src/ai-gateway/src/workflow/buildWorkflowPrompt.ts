import type { WorkflowConnectors } from '../dsl/buildConstrainedSchema.ts'
import type { WorkflowIssue } from '../dsl/validateWorkflow.ts'
import { type FieldPath, assignableRequestPaths, flattenFieldPaths } from '../invokers/fieldPaths.ts'
import type { Invoker, InvokerOperation } from '../invokers/invoker.types.ts'

// Caps keep a large invoker inside the context window; the constrained schema still allows every field.
const MAX_BODY_PATHS = 40
const MAX_RESPONSE_PATHS = 40

function listPaths(paths: FieldPath[], max: number): string {
    if (paths.length === 0) return '-'
    const shown = paths.slice(0, max).map((field) => `${field.path}:${field.type}`)
    return paths.length > max ? `${shown.join(', ')}, ...` : shown.join(', ')
}

function describeOperation(operation: InvokerOperation, requiredData: string[]): string {
    const params = operation.endpointParams.length ? operation.endpointParams.join(', ') : '-'
    return [
        `- ${operation.name}: ${operation.httpMethod} ${operation.endpoint}`,
        `    params: ${params}`,
        `    body: ${listPaths(assignableRequestPaths(operation.requestFields, requiredData), MAX_BODY_PATHS)}`,
        `    response: ${listPaths(flattenFieldPaths(operation.responseFields), MAX_RESPONSE_PATHS)}`,
    ].join('\n')
}

export function describeConnector(side: 'from' | 'to', invoker: Invoker): string {
    const operations = invoker.operations.map((operation) => describeOperation(operation, invoker.requiredData))
    return `${invoker.name} operations (connector "${side}"):\n${operations.join('\n')}`
}

export function buildWorkflowSystemPrompt(connectors: WorkflowConnectors): string {
    const sections = [describeConnector('from', connectors.from)]
    if (connectors.to) sections.push(describeConnector('to', connectors.to))

    return `You design integration workflows for OpenCelium. Answer with JSON only.

A workflow is a tree of steps with ids s1, s2, s3, ... in document order:
- method: calls one operation on the connector that owns it. "params" fills endpoint placeholders, "fields" sets request body fields (dot paths).
- if: runs "then" only when the condition holds.
- loop: iterates over an array in an earlier method step's response ("over").

Condition operators ("op"): eq, ne, gt, lt; contains / not_contains (a list or text contains the right value, or not);
exists / empty (the left value is present and non-empty, or missing / empty). For exists and empty set "right" to {"literal":""}.

A value is one of:
  {"literal":"text"}
  {"ref":{"step":"<earlier method step id>","path":"<dot path in its response>"}}
  {"ref":{"step":"<enclosing loop id>","path":"<dot path inside the current array element>"}}
A body field (not a param, not a condition) may instead be computed by a script:
  {"script":{"inputs":[<ref>, ...],"code":"<JavaScript>","description":"<what it computes>"}}
  inputs[0] is available as VAR_0, inputs[1] as VAR_1, ...; the code must assign RESULT_VAR. It runs on Nashorn, so write
  ECMAScript 5.1 only: var and function, no let/const/arrow functions/template strings/includes/find.
  Use a script only when a field needs computing: mapping one value to another, looking an item up in a list, combining
  several values, or building an object. Copy a value with a plain ref. Put scripts only on the fields the request asks
  for, and declare one input for every VAR_n the code uses.

Rules:
- Use only the operations, params and body fields listed below.
- Connection settings and credentials (url, username, password, token, API keys) come from the connector; they are not listed and must never be set.
- Inside a loop, read the current element through the loop's id; the path starts inside the element.
- A loop's id is only valid inside that loop. To go over the same list again later, add a new loop whose "over" is the method step that returned the list, and read the element through the new loop's id.
- To test whether a list or value is present, use the exists / empty operators on it; never append .length to a path.
- Add only the steps the request needs.
- The request may end with a reviewed plan. Follow it step by step: a step numbered under another (2.1 under 2) runs inside
  that loop or if. "Loop A: For each ..." starts a loop; its steps stay inside it until "Loop A ends here.". Every loop in
  the plan is its own loop step, and its "over" is the method step that returned the list, never another loop.

${sections.join('\n\n')}`
}

export function buildRepairMessage(issues: WorkflowIssue[]): string {
    const lines = issues.map((issue) => `- ${issue.stepId ? `${issue.stepId}: ` : ''}${issue.message}`)
    return `The workflow has these problems:\n${lines.join('\n')}\nReturn the complete corrected workflow.`
}
