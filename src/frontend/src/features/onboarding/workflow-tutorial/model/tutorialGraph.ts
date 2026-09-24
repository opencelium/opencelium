import type { Connector } from '@entities/connector/model/types'
import { resolveConnectorIcon } from '@entities/connector/model/iconUrl'
import { initialEdges, initialNodes } from '@features/workflow/data/initialGraph'
import { createNodeFromAction } from '@features/workflow/utils/createNodeFromAction'
import type { WorkflowAction, WorkflowNodeModel } from '@features/workflow/types/workflow.types'
import type { SimulatedWorkflowGraph } from '@features/workflow/hooks/simulatedWorkflowGraph'
import { buildConditionConfig } from '@features/workflow/components/condition-builder/conditionBuilder.utils'
import { createEmptyGroup, createEmptyRule } from '@features/workflow/components/condition-builder/conditionTreeFactory'
import { IfOperatorName, LoopOperatorName } from '@features/workflow/components/condition-builder/conditionBuilder.types'
import { buildReferenceValue, ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions'
import { collectEnhancementsFromObject } from '@features/workflow/components/request-editor/body-editor/bodyBindingCollection'
import { deserializeBackendReferenceTokens } from '@features/workflow/components/request-editor/url-editor/urlBackendReferences'
import { buildQueryParamsFromEndpoint } from '@features/workflow/components/request-editor/url-editor/urlEditor.utils'
import { TUTORIAL_CONNECTORS } from './tutorialFixtures'
import { TUTORIAL_STEPS, USERNAME_EXAMPLE } from './tutorialSteps'

type Graph = SimulatedWorkflowGraph

const [CRM, SUPPORT] = TUTORIAL_CONNECTORS
const [GET_CUSTOMERS] = CRM.invoker.operations
const [GET_CLIENT, CREATE_CLIENT] = SUPPORT.invoker.operations
const ITERATOR = ITERATOR_NAMES[0]
const START_ID = initialNodes[0].id

/** Places a node exactly as the sidebar would — through the editor's own factory. */
const addNode = (graph: Graph, action: WorkflowAction): Graph => {
    const next = createNodeFromAction({ action, nodes: graph.nodes, edges: graph.edges })
    return { ...graph, nodes: next.nodes, edges: next.edges }
}

/** The connector reference the sidebar's method list hands over for a pick. */
const addMethod = (
    graph: Graph,
    from: Pick<WorkflowAction, 'sourceNodeId' | 'sourceHandle' | 'direction'>,
    connector: Connector,
    operationIndex: number,
): Graph => {
    const operation = connector.invoker.operations[operationIndex]
    return addNode(graph, {
        ...from,
        kind: 'connector',
        methodName: operation.name,
        methodOperation: operation,
        connector: {
            connectorId: connector.connectorId,
            title: connector.title,
            icon: resolveConnectorIcon(connector),
        },
    })
}

const methodNode = (graph: Graph, name: string): WorkflowNodeModel => {
    const node = graph.nodes.find(item => item.data.methodConfig?.name === name)
    if (!node) throw new Error(`workflow tutorial: no ${name} node to build on`)
    return node
}

const operatorNode = (graph: Graph, type: 'loop' | 'if'): WorkflowNodeModel => {
    const node = graph.nodes.find(item => item.type === type)
    if (!node) throw new Error(`workflow tutorial: no ${type} node to build on`)
    return node
}

const updateNode = (
    graph: Graph,
    id: string,
    update: (node: WorkflowNodeModel) => WorkflowNodeModel,
): Graph => ({ ...graph, nodes: graph.nodes.map(node => (node.id === id ? update(node) : node)) })

/** A body reference to a placed method's response, as the reference pickers build it. */
const responseRef = (graph: Graph, methodName: string, path: string) =>
    buildReferenceValue(methodNode(graph, methodName).data.color ?? '', 'body', path)

/**
 * Each step's result, keyed by the step that produces it and applied in tutorial
 * order. Built from the same answers the steps ask for — the picks, the condition,
 * the enhancement script — so a jumped-to step finds what a full run would have left.
 */
const STAGES: { after: string; apply: (graph: Graph) => Graph }[] = [
    {
        after: 'customers',
        apply: graph => addMethod(graph, { sourceNodeId: START_ID, direction: 'right' }, CRM, 0),
    },
    {
        after: 'loop',
        apply: graph => addNode(graph, {
            sourceNodeId: methodNode(graph, GET_CUSTOMERS.name).id, direction: 'right', kind: 'loop',
        }),
    },
    {
        after: 'iterate',
        apply: graph => {
            const group = createEmptyGroup('loop')
            const rule = {
                ...createEmptyRule(),
                properties: {
                    operator: LoopOperatorName.For,
                    leftField: responseRef(graph, GET_CUSTOMERS.name, 'customers[*]'),
                },
            }
            const conditionConfig = buildConditionConfig('loop', { ...group, items: [rule] }, ITERATOR)
            return updateNode(graph, operatorNode(graph, 'loop').id,
                node => ({ ...node, data: { ...node.data, conditionConfig } }))
        },
    },
    {
        after: 'lookup',
        apply: graph => addMethod(graph, {
            sourceNodeId: operatorNode(graph, 'loop').id, sourceHandle: 'bottom', direction: 'bottom',
        }, SUPPORT, 0),
    },
    {
        // The URL editor stores an inserted reference as a token plus its source; the
        // backend form is decoded into exactly that, as a loaded workflow's would be.
        after: 'endpoint',
        apply: graph => {
            const reference = responseRef(graph, GET_CUSTOMERS.name, `customers[${ITERATOR}].email`)
            const node = methodNode(graph, GET_CLIENT.name)
            const config = node.data.methodConfig!
            const { value, endpointArgs } = deserializeBackendReferenceTokens(
                `${config.url}{%${reference}%}`, config.endpointArgs)
            return updateNode(graph, node.id, current => ({
                ...current,
                data: {
                    ...current.data,
                    methodConfig: {
                        ...config, url: value, endpointArgs, queryParams: buildQueryParamsFromEndpoint(value),
                    },
                },
            }))
        },
    },
    {
        after: 'branch',
        apply: graph => addNode(graph, {
            sourceNodeId: methodNode(graph, GET_CLIENT.name).id, direction: 'right', kind: 'if',
        }),
    },
    {
        after: 'condition',
        apply: graph => {
            const rule = {
                ...createEmptyRule(),
                properties: {
                    leftField: responseRef(graph, GET_CLIENT.name, 'client.email'),
                    operator: IfOperatorName.NotEqual,
                    rightField: responseRef(graph, GET_CUSTOMERS.name, `customers[${ITERATOR}].email`),
                },
            }
            const conditionConfig = buildConditionConfig('if', { ...createEmptyGroup('if'), items: [rule] })
            return updateNode(graph, operatorNode(graph, 'if').id,
                node => ({ ...node, data: { ...node.data, conditionConfig } }))
        },
    },
    {
        after: 'create',
        apply: graph => addMethod(graph, {
            sourceNodeId: operatorNode(graph, 'if').id, sourceHandle: 'true', direction: 'bottom',
        }, SUPPORT, 1),
    },
    {
        // Two references in one field, joined with `;` as the body editor joins them,
        // and the enhancement it derives from them carrying the step's script.
        after: 'username',
        apply: graph => {
            const node = methodNode(graph, CREATE_CLIENT.name)
            const color = node.data.color ?? ''
            const config = node.data.methodConfig!
            const username = [
                responseRef(graph, GET_CUSTOMERS.name, `customers[${ITERATOR}].firstName`),
                responseRef(graph, GET_CUSTOMERS.name, `customers[${ITERATOR}].lastName`),
            ].join(';')
            const body = { ...(config.body as Record<string, unknown>), username }
            const enhancements = collectEnhancementsFromObject({ username }, color, 'body')
                .map(enhancement => ({ enhancement: { ...enhancement, script: USERNAME_EXAMPLE } }))
            const withBody = updateNode(graph, node.id, current => ({
                ...current, data: { ...current.data, methodConfig: { ...config, body } },
            }))
            return { ...withBody, fieldBindings: [...withBody.fieldBindings, ...enhancements] }
        },
    },
]

/**
 * The graph a run of the tutorial has built by the time it reaches step `floor`:
 * every stage whose step comes before it. Null when there is nothing to build — the
 * first steps start on an empty canvas anyway.
 */
export function buildTutorialGraph(floor: number): Graph | null {
    const stepIndex = (id: string) => TUTORIAL_STEPS.findIndex(step => step.id === id)
    const stages = STAGES.filter(stage => stepIndex(stage.after) < floor)
    if (!stages.length) return null
    return stages.reduce<Graph>((graph, stage) => stage.apply(graph),
        { nodes: initialNodes, edges: initialEdges, fieldBindings: [] })
}
