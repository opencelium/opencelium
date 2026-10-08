import { workflowJsonSchema, type WorkflowJsonPayload } from './workflowJson.schema';
import { mapConnectionToWorkflowState } from '../../../api/connectionMapper';
import { findInvalidWorkflowReferences } from '../../../utils/graph.invalidReferences';
import { findBrokenEnhancementScripts } from '../../../utils/graph.brokenScriptValidation';
import { evaluateJointTargets } from '../../../utils/jumpValidator';
import { buildQueryParamsFromEndpoint } from '../../request-editor/url-editor/urlEditor.utils';
import { generateTreeByExpression } from '../../condition-builder/conditionExpressionParser';
import { methodsToEntries } from '../../../api/connectionMapper.entries';
import { applyWorkflowLeafState, buildWorkflowEdges } from '../../../api/connectionMapper.graph';
import { buildWorkflowIndexes } from '../../../api/connectionPayload';
import { normalizeWorkflowPositions } from '../../../utils/graph.dragDrop';

export type WorkflowJsonError = { key: string; path?: string; reason?: string };
export type WorkflowJsonValidation =
	| { success: true; data: WorkflowJsonPayload }
	| { success: false; errors: WorkflowJsonError[] };
export type WorkflowJsonValidationContext = {
	connectors?: ReadonlyArray<{ connectorId: number; invoker: { name: string } }>;
	categoryIds?: ReadonlyArray<number>;
	aggregatorIds?: ReadonlyArray<number>;
	connections?: ReadonlyArray<{ id: number; title: string }>;
	connectionsLoaded?: boolean;
};

const INDEX_RE = /^\d+(?:_\d+)*$/;

const withoutDerivedUiConfig = (payload: WorkflowJsonPayload): unknown => {
	const entryTypes = new Map<string, string>([
		...payload.fromConnector.methods.map((method) => [method.id,
			method.methodType === 'HTTP_REQUEST' ? 'system'
				: method.methodType === 'WEBHOOK' ? 'trigger-connection' : 'connector'] as const),
		...payload.fromConnector.operators.map((operator) => [operator.id,
			operator.type.toLowerCase() === 'loop' ? 'loop' : 'if'] as const),
	]);
	return { ...payload, name: payload.title, ui: { ...payload.ui,
		workflowNodes: payload.ui.workflowNodes.map((node) => {
			const entryType = entryTypes.get(node.id);
			if (!entryType) return node;
			const data: Record<string, unknown> = { ...node.data };
			['title', 'subtitle', 'kind', 'connector', 'methodConfig', 'conditionConfig']
				.forEach((key) => delete data[key]);
			return { ...node, type: entryType, data };
		}),
	} };
};

export const mapWorkflowJsonToWorkflowState = (payload: WorkflowJsonPayload) => {
	const state = mapConnectionToWorkflowState(withoutDerivedUiConfig(payload));
	const entries = methodsToEntries(payload.fromConnector.methods, payload.fromConnector.operators);
	const currentIndexes = buildWorkflowIndexes(state.nodes, state.edges);
	const indexesChanged = entries.some((entry) => currentIndexes.get(entry.node.id) !== entry.index);
	const nodesById = new Map(state.nodes.map((node) => [node.id, node]));
	const indexedEntries = entries.map((entry) => ({
		...entry, node: nodesById.get(entry.node.id) ?? entry.node,
	}));
	const edges = indexesChanged ? buildWorkflowEdges(indexedEntries) : state.edges;
	const graphNodes = indexesChanged
		? applyWorkflowLeafState(normalizeWorkflowPositions(state.nodes, edges), edges)
		: state.nodes;
	return {
		...state,
		edges,
		nodes: graphNodes.map((node) => {
			const methodConfig = node.data.methodConfig;
			if (!methodConfig) return node;
			return { ...node, data: { ...node.data, methodConfig: {
				...methodConfig,
				queryParams: buildQueryParamsFromEndpoint(
					methodConfig.url, methodConfig.queryParams,
				),
			} } };
		}),
	};
};

export function validateWorkflowJson(value: unknown,
	context: WorkflowJsonValidationContext = {}): WorkflowJsonValidation {
	const parsed = workflowJsonSchema.safeParse(value);
	if (!parsed.success) {
		return { success: false, errors: parsed.error.issues.slice(0, 5).map((issue) => ({
			key: 'json.errors.schema',
			path: [...issue.path, ...(issue.code === 'unrecognized_keys' ? issue.keys.slice(0, 1) : [])]
				.join('.'),
			reason: issue.message,
		})) };
	}

	const { methods, operators } = parsed.data.fromConnector;
	if (context.connectionsLoaded === false) return { success: false, errors: [{
		key: 'json.errors.connectionNamesUnavailable', path: 'title',
	}] };
	const normalizedTitle = parsed.data.title.trim().toLocaleLowerCase();
	if (context.connections?.some((connection) => connection.id !== parsed.data.connectionId
		&& connection.title.trim().toLocaleLowerCase() === normalizedTitle)) {
		return { success: false, errors: [{ key: 'json.errors.titleTaken', path: 'title' }] };
	}
	if (parsed.data.categoryId !== null && context.categoryIds
		&& !context.categoryIds.includes(parsed.data.categoryId)) return { success: false, errors: [{
			key: 'json.errors.unknownCategory', path: 'categoryId',
		}] };
	const aggregatorIds = context.aggregatorIds ? new Set(context.aggregatorIds) : null;
	const entryIds = new Set<string>();
	const methodColors = new Set<string>();
	const bindingIds = new Set<string>();
	for (const [index, binding] of parsed.data.fieldBinding.entries()) {
		if (binding.id !== undefined) {
			const id = String(binding.id);
			if (bindingIds.has(id)) return { success: false, errors: [{
				key: 'json.errors.duplicateBinding', path: `fieldBinding.${index}.id`,
			}] };
			bindingIds.add(id);
		}
		if (!binding.from?.length && !binding.to?.length && !binding.enhancement) {
			return { success: false, errors: [{
				key: 'json.errors.emptyBinding', path: `fieldBinding.${index}`,
			}] };
		}
		if (binding.enhancement && 'args' in binding.enhancement) {
			if (!binding.enhancement.script.trim()) return { success: false, errors: [{
				key: 'json.errors.emptyEnhancementScript',
				path: `fieldBinding.${index}.enhancement.script`,
			}] };
			if (!binding.enhancement.args.RESULT_VAR?.trim()) return { success: false, errors: [{
				key: 'json.errors.missingEnhancementResult',
				path: `fieldBinding.${index}.enhancement.args.RESULT_VAR`,
			}] };
		}
	}
	for (const [index, method] of methods.entries()) {
		const idPath = `fromConnector.methods.${index}.id`;
		if (entryIds.has(method.id)) return { success: false,
			errors: [{ key: 'json.errors.duplicateEntryId', path: idPath }] };
		entryIds.add(method.id);
		const normalizedColor = method.color.toLowerCase();
		if (methodColors.has(normalizedColor)) return { success: false, errors: [{
			key: 'json.errors.duplicateColor', path: `fromConnector.methods.${index}.color`,
		}] };
		methodColors.add(normalizedColor);
		if (method.dataAggregator !== null && aggregatorIds
			&& !aggregatorIds.has(method.dataAggregator)) return { success: false, errors: [{
				key: 'json.errors.unknownAggregator',
				path: `fromConnector.methods.${index}.dataAggregator`,
			}] };
		const connectorPath = `fromConnector.methods.${index}.connector`;
		if (method.methodType === 'CONNECTOR' && !method.connector) return { success: false,
			errors: [{ key: 'json.errors.connectorRequired', path: connectorPath }] };
		if (method.methodType !== 'CONNECTOR' && method.connector) return { success: false,
			errors: [{ key: 'json.errors.connectorForbidden', path: connectorPath }] };
	}
	for (const [index, operator] of operators.entries()) {
		const idPath = `fromConnector.operators.${index}.id`;
		if (entryIds.has(operator.id)) return { success: false,
			errors: [{ key: 'json.errors.duplicateEntryId', path: idPath }] };
		entryIds.add(operator.id);
		if (operator.dataAggregator !== null && aggregatorIds
			&& !aggregatorIds.has(operator.dataAggregator)) return { success: false, errors: [{
				key: 'json.errors.unknownAggregator',
				path: `fromConnector.operators.${index}.dataAggregator`,
			}] };
		if (operator.type.toLowerCase() === 'loop' && !operator.iterator) return {
			success: false, errors: [{ key: 'json.errors.iteratorRequired',
				path: `fromConnector.operators.${index}.iterator` }],
		};
		if (operator.type.toLowerCase() === 'if' && operator.iterator !== undefined) return {
			success: false, errors: [{ key: 'json.errors.iteratorForbidden',
				path: `fromConnector.operators.${index}.iterator` }],
		};
		if (!generateTreeByExpression(operator.expression, operator.type.toLowerCase() as 'if' | 'loop')) {
			return { success: false, errors: [{ key: 'json.errors.invalidExpression',
				path: `fromConnector.operators.${index}.expression` }] };
		}
	}
	if (context.connectors) {
		const connectorById = new Map(context.connectors.map((connector) =>
			[connector.connectorId, connector]));
		for (const [index, method] of methods.entries()) {
			if (method.methodType !== 'CONNECTOR') continue;
			const path = `fromConnector.methods.${index}.connector`;
			if (!method.connector || !connectorById.has(method.connector.connectorId)) {
				return { success: false, errors: [{ key: 'json.errors.unknownConnector', path }] };
			}
			const expectedInvoker = connectorById.get(method.connector.connectorId)?.invoker.name;
			if (method.connector.invoker !== expectedInvoker) return { success: false, errors: [{
				key: 'json.errors.invalidInvoker', path: `${path}.invoker`, reason: expectedInvoker,
			}] };
		}
	}
	const entries = [...methods, ...operators];
	const indexes = new Set<string>();
	const operatorIndexes = new Set(operators.map((operator) => operator.index));
	for (const [position, entry] of entries.entries()) {
		const isOperator = 'type' in entry;
		const arrayPosition = isOperator ? position - methods.length : position;
		const path = `fromConnector.${isOperator ? 'operators' : 'methods'}.${arrayPosition}.index`;
		if (!INDEX_RE.test(entry.index)) return { success: false,
			errors: [{ key: 'json.errors.indexShape', path }] };
		if (indexes.has(entry.index)) return { success: false,
			errors: [{ key: 'json.errors.duplicateIndex', path }] };
		indexes.add(entry.index);
		const separator = entry.index.lastIndexOf('_');
		if (separator > 0 && !operatorIndexes.has(entry.index.slice(0, separator))) {
			return { success: false, errors: [{ key: 'json.errors.missingParent', path }] };
		}
	}

	const nodes = parsed.data.ui.workflowNodes;
	const nodeIds = new Set<string>();
	for (const [index, node] of nodes.entries()) {
		if (nodeIds.has(node.id)) return { success: false,
			errors: [{ key: 'json.errors.duplicateNode', path: `ui.workflowNodes.${index}.id` }] };
		nodeIds.add(node.id);
	}
	for (const [index, node] of nodes.entries()) {
		const commentPath = `ui.workflowNodes.${index}.data.comment`;
		if (node.type === 'comment' && !node.data.comment) return { success: false, errors: [{
			key: 'json.errors.commentRequired', path: commentPath,
		}] };
		if (node.type !== 'comment' && node.data.comment) return { success: false, errors: [{
			key: 'json.errors.commentForbidden', path: commentPath,
		}] };
		if (node.data.comment && !nodeIds.has(node.data.comment.anchorNodeId)) {
			return { success: false, errors: [{ key: 'json.errors.commentAnchor',
				path: `${commentPath}.anchorNodeId` }] };
		}
	}
	const startCount = nodes.filter((node) => node.type === 'start').length;
	if (startCount !== 1) return { success: false,
		errors: [{ key: 'json.errors.startCount', path: 'ui.workflowNodes', reason: String(startCount) }] };
	for (const [index, entry] of [...methods, ...operators].entries()) {
		if (!nodeIds.has(entry.id)) return { success: false, errors: [{
			key: 'json.errors.entryNodeMissing',
			path: `fromConnector.${index < methods.length ? 'methods' : 'operators'}.${
				index < methods.length ? index : index - methods.length}.id`,
		}] };
	}
	const executableNodeTypes = new Set(['connector', 'system', 'trigger-connection', 'if', 'loop']);
	for (const [index, node] of nodes.entries()) {
		if (executableNodeTypes.has(node.type) && !entryIds.has(node.id)) return {
			success: false, errors: [{ key: 'json.errors.orphanEntryNode',
				path: `ui.workflowNodes.${index}.id` }],
		};
	}
	const edgeIds = new Set<string>();
	for (const [index, edge] of parsed.data.ui.workflowEdges.entries()) {
		if (edgeIds.has(edge.id)) return { success: false, errors: [{
			key: 'json.errors.duplicateEdge', path: `ui.workflowEdges.${index}.id`,
		}] };
		edgeIds.add(edge.id);
		if (!nodeIds.has(edge.source)) return { success: false,
			errors: [{ key: 'json.errors.edgeSource', path: `ui.workflowEdges.${index}.source` }] };
		if (!nodeIds.has(edge.target)) return { success: false,
			errors: [{ key: 'json.errors.edgeTarget', path: `ui.workflowEdges.${index}.target` }] };
	}
	if (parsed.data.ui.flowcharts) {
		const flowIds = new Set<string>();
		for (const [index, flowchart] of parsed.data.ui.flowcharts.entries()) {
			if (flowIds.has(flowchart.flowId)) return { success: false, errors: [{
				key: 'json.errors.duplicateFlowchart', path: `ui.flowcharts.${index}.flowId`,
			}] };
			flowIds.add(flowchart.flowId);
			if (!nodeIds.has(flowchart.flowId)) return { success: false, errors: [{
				key: 'json.errors.flowchartNode', path: `ui.flowcharts.${index}.flowId`,
			}] };
		}
	}
	if (parsed.data.ui.flowchartEdges) {
		const legacyEdgeIds = new Set<string>();
		for (const [index, edge] of parsed.data.ui.flowchartEdges.entries()) {
			if (legacyEdgeIds.has(edge.id)) return { success: false, errors: [{
				key: 'json.errors.duplicateFlowchartEdge',
				path: `ui.flowchartEdges.${index}.id`,
			}] };
			legacyEdgeIds.add(edge.id);
			const workflowEdge = parsed.data.ui.workflowEdges.find((item) => item.id === edge.id);
			if (!workflowEdge || workflowEdge.source !== edge.source
				|| workflowEdge.target !== edge.target
				|| (workflowEdge.sourceHandle ?? null) !== (edge.sourceHandle ?? null)
				|| (workflowEdge.targetHandle ?? null) !== (edge.targetHandle ?? null)) return {
				success: false, errors: [{ key: 'json.errors.flowchartEdgeMismatch',
					path: `ui.flowchartEdges.${index}` }],
			};
		}
		if (legacyEdgeIds.size !== edgeIds.size) return { success: false, errors: [{
			key: 'json.errors.flowchartEdgeCount', path: 'ui.flowchartEdges',
		}] };
	}
	try {
		const state = mapWorkflowJsonToWorkflowState(parsed.data);
		const nonStartNodes = state.nodes.filter((node) => node.type !== 'start');
		if (methods.length > 0 && nonStartNodes.length === 0) return { success: false,
			errors: [{ key: 'json.errors.mapperDroppedMethods', path: 'fromConnector.methods' }] };
		const invalidReferences = findInvalidWorkflowReferences(
			state.nodes, state.edges, undefined, state.fieldBindings,
		);
		if (invalidReferences.length) {
			const broken = invalidReferences[0];
			const nodeIndex = nodes.findIndex((item) => item.id === broken.consumerNodeId);
			return { success: false, errors: [{ key: 'json.errors.brokenReference',
				path: nodeIndex >= 0 ? `ui.workflowNodes.${nodeIndex}` : 'fieldBinding',
				reason: broken.sourceColor }] };
		}
		const brokenScripts = findBrokenEnhancementScripts(state.nodes, state.fieldBindings);
		if (brokenScripts.length) {
			const broken = brokenScripts[0];
			const nodeIndex = broken.nodeId
				? nodes.findIndex((item) => item.id === broken.nodeId) : -1;
			return { success: false, errors: [{ key: 'json.errors.brokenScript',
				path: nodeIndex >= 0 ? `ui.workflowNodes.${nodeIndex}` : 'fieldBinding' }] };
		}
		for (const node of state.nodes) {
			if (!node.data.jump) continue;
			const verdict = evaluateJointTargets(node.id, state.nodes, state.edges,
				state.fieldBindings).get(node.data.jump);
			const nodeIndex = nodes.findIndex((item) => item.id === node.id);
			if (!verdict?.valid) return { success: false, errors: [{
				key: `json.errors.illegalJoint.${verdict?.reason ?? 'missingTarget'}`,
				path: nodeIndex >= 0 ? `ui.workflowNodes.${nodeIndex}` : 'ui.workflowNodes',
			}] };
		}
	} catch (error: unknown) {
		return { success: false, errors: [{ key: 'json.errors.mapperFailed',
			path: 'fromConnector', reason: error instanceof Error ? error.message : String(error) }] };
	}
	return { success: true, data: parsed.data };
}
