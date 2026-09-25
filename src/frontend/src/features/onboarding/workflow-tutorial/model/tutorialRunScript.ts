import type {
    DetailedMethodLog,
    ExecutionSocketLog,
    FlowchartChildLog,
    LogStatus,
} from '@features/logs'
import { appendLoopIndex } from '@features/logs'
import { isKnownCustomer, TUTORIAL_ITERATIONS, tutorialDuration, tutorialExchange } from './tutorialRunFixtures'

/**
 * Turns the graph the user just built into the socket stream a backend run of it
 * would have produced, plus the canned REST answers the log tree asks for when a row
 * is opened. Structure comes from the payload rather than from a hardcoded script, so
 * a user who built the scenario loosely — an extra method, a method left out — still
 * watches their own graph execute instead of somebody else's.
 *
 * The line grammar is the backend's, as `executionLogFrame` documents it:
 *  - one FLOWCHART PENDING opens the connector and one COMPLETE closes it;
 *  - operators emit PENDING on entry and COMPLETE on exit;
 *  - methods emit a single COMPLETE — no PENDING at all;
 *  - one EXECUTION COMPLETE ends the run.
 * Getting this wrong is invisible until the canvas animation stalls, because
 * `isStepLine` is what decides which lines move the travelling token.
 */

const EXECUTION_ID = 'tutorial-execution'
const CONNECTOR_NAME = 'Tutorial CRM'

/** What this module reads out of the save-shaped payload; the rest is not its business. */
type PayloadMethod = {
    id?: string
    index?: string
    name?: string
    label?: string
    request?: { endpoint?: string; method?: string }
}
type PayloadOperator = { id?: string; index?: string; type?: string; iterator?: string; expression?: string }
type TestPayload = { fromConnector?: { methods?: PayloadMethod[]; operators?: PayloadOperator[] } }

type ScriptElement = {
    kind: 'method' | 'loop' | 'if'
    index: string
    flowId: string
    name: string
    label?: string
    url: string
    httpMethod: string
    iterator: string
    expression: string
    children: ScriptElement[]
}

/** Numeric, segment-wise: `1_10` sorts after `1_2`, which a string compare gets wrong. */
const lastSegment = (index: string) => Number(index.split('_').at(-1) ?? 0)
const parentOf = (index: string) => index.split('_').slice(0, -1).join('_')

const toElement = (
    kind: ScriptElement['kind'],
    index: string,
    source: PayloadMethod & PayloadOperator,
): ScriptElement => ({
    kind,
    index,
    flowId: source.id ?? index,
    name: source.name ?? '',
    label: source.label,
    url: source.request?.endpoint ?? '',
    httpMethod: source.request?.method ?? 'GET',
    iterator: source.iterator ?? 'i',
    expression: source.expression ?? '',
    children: [],
})

/**
 * The payload's flat, tree-path-indexed lists rebuilt into the tree those paths
 * describe: `1_0` is the first child of `1`. Elements whose parent is missing are
 * dropped rather than promoted to the root — a run cannot enter a scope that the
 * graph does not have, and silently flattening one would teach the wrong shape.
 */
export function buildRunTree(payload: unknown): ScriptElement[] {
    const { methods = [], operators = [] } = (payload as TestPayload)?.fromConnector ?? {}
    const elements = new Map<string, ScriptElement>()
    for (const method of methods) {
        if (method.index) elements.set(method.index, toElement('method', method.index, method))
    }
    for (const operator of operators) {
        if (!operator.index) continue
        const kind = operator.type === 'loop' ? 'loop' : 'if'
        elements.set(operator.index, toElement(kind, operator.index, operator))
    }

    const roots: ScriptElement[] = []
    for (const element of [...elements.values()].sort((a, b) => a.index.length - b.index.length)) {
        const parent = elements.get(parentOf(element.index))
        if (!element.index.includes('_')) roots.push(element)
        else if (parent) parent.children.push(element)
    }
    const sort = (list: ScriptElement[]) => {
        list.sort((a, b) => lastSegment(a.index) - lastSegment(b.index))
        list.forEach((element) => sort(element.children))
    }
    sort(roots)
    return roots
}

/**
 * One occurrence of an element: the same node inside a loop exists once per
 * iteration, so its persisted id has to be per-occurrence too — that id is what the
 * log tree hands back to `/execution/log/element/{id}/details`.
 */
const occurrenceId = (index: string, loopIndex: string) =>
    `tut-${index || 'root'}-${loopIndex.replace(/,/g, '-') || 'r'}`

const line = (
    element: ScriptElement,
    status: LogStatus,
    loopIndex: string,
    extra: Partial<ExecutionSocketLog> = {},
): ExecutionSocketLog => ({
    executionId: EXECUTION_ID,
    flowId: element.flowId,
    indexPath: element.index,
    id: occurrenceId(element.index, loopIndex),
    status,
    type: element.kind === 'method' ? 'OPERATION' : element.kind === 'loop' ? 'LOOP' : 'IF',
    connectorName: CONNECTOR_NAME,
    properties: { loopIndex },
    segment: {},
    error: null,
    ...extra,
})

/** Which iteration of the outermost enclosing loop this occurrence belongs to. */
const iterationOf = (loopIndex: string) => Number(loopIndex.split(',')[0] || 0)

const methodLine = (element: ScriptElement, loopIndex: string): ExecutionSocketLog => {
    const iteration = iterationOf(loopIndex)
    const { status } = tutorialExchange(element.name, iteration)
    return line(element, 'COMPLETE', loopIndex, {
        properties: { loopIndex, name: element.name, ...(element.label ? { label: element.label } : {}) },
        segment: {
            request: { url: element.url, http_method: element.httpMethod },
            response: { status, duration: tutorialDuration(element.name, iteration) },
        },
    })
}

/**
 * Whether the IF lets this iteration through. Driven by the same "already has an
 * account" flag the lookup's response is built from, so the branch the canvas takes
 * agrees with the body the user can open one row above it — an IF reporting `true`
 * over a `found: true` response would quietly teach that the condition is decorative.
 */
const ifResult = (loopIndex: string): 'true' | 'false' =>
    isKnownCustomer(iterationOf(loopIndex)) ? 'false' : 'true'

export type TutorialRunScript = {
    logs: ExecutionSocketLog[]
    /** Canned answers for the REST calls the log tree makes on expand. */
    overrides: Record<string, unknown>
}

/**
 * The run, as lines plus the REST answers behind them.
 *
 * `LiveLogTree` keeps only a loop's first iteration in memory and re-fetches the rest
 * over `/execution/log/element/{id}/children?loopIndex=N` — so a simulated run that
 * emitted lines alone would leave the loop's pager showing three iterations and able
 * to open exactly one. Registering those children as request overrides is what makes
 * the pager real, and it goes through the same mechanism the tutorial already uses
 * for the connector list.
 */
export function buildTutorialRunScript(payload: unknown): TutorialRunScript {
    const roots = buildRunTree(payload)
    const logs: ExecutionSocketLog[] = []
    const overrides: Record<string, unknown> = {}

    const detail = (element: ScriptElement, loopIndex: string): DetailedMethodLog => {
        const iteration = iterationOf(loopIndex)
        const { request, response, status } = tutorialExchange(element.name, iteration)
        return {
            executionId: EXECUTION_ID,
            flowId: element.flowId,
            indexPath: element.index,
            id: occurrenceId(element.index, loopIndex),
            status: 'COMPLETE',
            type: 'OPERATION',
            connectorName: CONNECTOR_NAME,
            properties: { name: element.name, ...(element.label ? { label: element.label } : {}) },
            segment: {
                request: {
                    url: element.url,
                    http_method: element.httpMethod,
                    header: JSON.stringify({ 'Content-Type': 'application/json' }),
                    payload: JSON.stringify(request),
                },
                response: {
                    status,
                    duration: tutorialDuration(element.name, iteration),
                    header: JSON.stringify({ 'Content-Type': 'application/json' }),
                    payload: JSON.stringify(response),
                },
            },
            error: null,
        }
    }

    /** The row shape the REST children endpoint returns for a re-fetched iteration. */
    const childLog = (element: ScriptElement, loopIndex: string): FlowchartChildLog => {
        const iteration = iterationOf(loopIndex)
        const base = {
            executionId: EXECUTION_ID,
            flowId: element.flowId,
            indexPath: element.index,
            id: occurrenceId(element.index, loopIndex),
            status: 'COMPLETE' as const,
            connectorName: CONNECTOR_NAME,
            error: null,
        }
        if (element.kind === 'method') {
            const { status } = tutorialExchange(element.name, iteration)
            return {
                ...base,
                type: 'OPERATION',
                properties: { name: element.name, ...(element.label ? { label: element.label } : {}) },
                segment: {
                    request: { url: element.url, http_method: element.httpMethod as 'GET' },
                    response: { status, duration: tutorialDuration(element.name, iteration) },
                },
            }
        }
        if (element.kind === 'loop') {
            return {
                ...base,
                type: 'LOOP',
                properties: { expression: element.expression, size: TUTORIAL_ITERATIONS, iterator: element.iterator },
                segment: {},
            }
        }
        return {
            ...base,
            type: 'IF',
            properties: { expression: element.expression },
            segment: { result: ifResult(loopIndex) },
        }
    }

    /**
     * Where the log tree asks an operator for the children it did not keep. Every
     * occurrence gets one, including a loop's first iteration: the tree prefers its
     * local copy there, but the pause reveal's walk (see resolveTraceTarget) drops
     * into REST the moment a level is missing and never looks locally again, so a
     * gap anywhere below that point strands the reveal.
     */
    const childrenUrl = (element: ScriptElement, loopIndex: string, iteration: number) =>
        `/execution/log/element/${occurrenceId(element.index, loopIndex)}/children?loopIndex=${iteration}`

    const walk = (elements: ScriptElement[], loopIndex: string) => {
        for (const element of elements) {
            if (element.kind === 'method') {
                logs.push(methodLine(element, loopIndex))
                overrides[`/execution/log/element/${occurrenceId(element.index, loopIndex)}/details`] =
                    detail(element, loopIndex)
                continue
            }
            if (element.kind === 'if') {
                const result = ifResult(loopIndex)
                const properties = { loopIndex, expression: element.expression }
                logs.push(line(element, 'PENDING', loopIndex, { properties, segment: { result } }))
                // A branch not taken ran nothing, so its children list is empty rather
                // than absent — an IF row opened on such an iteration says so.
                if (result === 'true') walk(element.children, loopIndex)
                overrides[childrenUrl(element, loopIndex, 0)] = result === 'true'
                    ? element.children.map((child) => childLog(child, loopIndex))
                    : []
                logs.push(line(element, 'COMPLETE', loopIndex, { properties, segment: { result } }))
                continue
            }
            const properties = {
                loopIndex,
                expression: element.expression,
                iterator: element.iterator,
                size: TUTORIAL_ITERATIONS,
            }
            logs.push(line(element, 'PENDING', loopIndex, { properties }))
            for (let iteration = 0; iteration < TUTORIAL_ITERATIONS; iteration += 1) {
                const nested = appendLoopIndex(loopIndex, iteration)
                walk(element.children, nested)
                overrides[childrenUrl(element, loopIndex, iteration)] =
                    element.children.map((child) => childLog(child, nested))
            }
            logs.push(line(element, 'COMPLETE', loopIndex, { properties }))
        }
    }

    logs.push({
        executionId: EXECUTION_ID, flowId: 'tutorial-flow', indexPath: '',
        id: 'tut-connector', status: 'PENDING', type: 'FLOWCHART', connectorName: CONNECTOR_NAME,
        properties: { CONNECTOR_ID: '-9001', DIRECTION: 'source' }, segment: {}, error: null,
    })
    walk(roots, '')
    logs.push({
        executionId: EXECUTION_ID, flowId: 'tutorial-flow', indexPath: '',
        id: 'tut-connector', status: 'COMPLETE', type: 'FLOWCHART', connectorName: CONNECTOR_NAME,
        properties: { CONNECTOR_ID: '-9001', DIRECTION: 'source' }, segment: {}, error: null,
    })
    logs.push({
        executionId: EXECUTION_ID, flowId: 'tutorial-flow', indexPath: '',
        id: 'tut-execution', status: 'COMPLETE', type: 'EXECUTION', connectorName: null,
        properties: {}, segment: {}, error: null,
    })

    return { logs, overrides }
}
