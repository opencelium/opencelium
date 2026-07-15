import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowMethodConfig } from '../types/request-config.types';
import type { HistoryVersionItem } from '../types/history.types';
import { initialEdges, initialNodes } from '../data/initialGraph';
import { OFFSETS, TITLES } from '../utils/graph.constants';
import { getBottomSourceHandle, getRightSourceHandle } from '../utils/graph.handles';
import { normalizeWorkflowPositions } from '../utils/graph.dragDrop';
import { ALL_COLORS } from '../constants/colors';
import { normalizeConnectionPayload } from './connectionPayload';
import { MethodType } from '../types/connection';

type MethodNodeKind = 'connector' | 'system' | 'trigger-connection';

const resolveMethodNodeKind = (method: any): MethodNodeKind => {
	switch (method?.methodType) {
		case MethodType.HttpRequest: return 'system';
		case MethodType.Webhook: return 'trigger-connection';
		case MethodType.Connector: return 'connector';
		default: return 'connector';
	}
};

export type WorkflowConnectionState = {
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: any[];
	versions: HistoryVersionItem[];
	viewport?: { x: number; y: number; zoom: number };
};

const methodToConfig = (method: any): WorkflowMethodConfig => ({
	name: method?.name,
	url: method?.request?.endpoint ?? '',
	method: method?.request?.method ?? 'GET',
	headers: method?.request?.header ?? {},
	queryParams: method?.request?.queryParams ?? [],
	endpointArgs: method?.request?.endpointArgs ?? {},
	bodyFormat: method?.request?.body?.format ?? 'json',
	bodyData: method?.request?.body?.data ?? 'raw',
	body: method?.request?.body?.fields ?? {},
	response: method?.response,
});

type IndexedWorkflowEntry = {
	index: string;
	path: number[];
	node: WorkflowNodeModel;
	source: any;
};

type SavedUiNode = {
	id: string;
	nodeId?: string;
	index?: string;
	color?: string;
	name?: string;
	type?: WorkflowNodeModel['type'];
	position: { x: number; y: number };
	data?: WorkflowNodeModel['data'];
	draggable?: boolean;
	deletable?: boolean;
};

type SavedUiEdge = WorkflowEdgeModel;

const normalizeIndex = (value: unknown, fallback: number) =>
	value === undefined || value === null || value === '' ? String(fallback) : String(value);

const parseIndexPath = (value: unknown) =>
	String(value ?? '')
		.split('_')
		.map((part) => Number(part))
		.map((part) => (Number.isFinite(part) ? part : 0));

const compareIndexPath = (left: number[], right: number[]) => {
	const length = Math.max(left.length, right.length);

	for (let index = 0; index < length; index += 1) {
		const leftPart = left[index] ?? -1;
		const rightPart = right[index] ?? -1;

		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return left.length - right.length;
};

const sortByIndex = <T extends { path: number[] }>(items: T[]) =>
	[...items].sort((left, right) => compareIndexPath(left.path, right.path));

const getMethodName = (method: any, index: number) => method?.label ?? method?.name ?? `Method ${index + 1}`;

const getNodePosition = (path: number[]) => {
	const startPosition = initialNodes[0]?.position ?? { x: 120, y: 220 };
	const [rootOrder = 0, ...nestedPath] = path;
	const nestedOffset = nestedPath.reduce((sum, part) => sum + part, 0);

	return {
		x: startPosition.x + OFFSETS.right.x * (rootOrder + 1 + nestedOffset),
		y: startPosition.y + OFFSETS.bottom.y * nestedPath.length,
	};
};

const toMethodEntry = (method: any, index: number): IndexedWorkflowEntry => {
	const methodIndex = normalizeIndex(method?.index, index);
	const path = parseIndexPath(methodIndex);
	const nodeKind = resolveMethodNodeKind(method);
	const hasConnector = nodeKind === 'connector';

	return {
		index: methodIndex,
		path,
		source: method,
		node: {
			id: method?.id ?? `method-${index}`,
			type: nodeKind,
			position: getNodePosition(path),
			data: {
				title: hasConnector ? method?.connector?.title ?? 'Connector' : TITLES[nodeKind],
				subtitle: getMethodName(method, index),
				labelEdited: Boolean(method?.label),
				kind: nodeKind,
				color: method?.color,
				...(hasConnector
					? {
						connector: {
							connectorId: method?.connector?.connectorId ?? -1,
							title: method?.connector?.title ?? 'DEFAULT',
							icon: method?.connector?.icon ?? null,
						},
					}
					: {}),
				methodConfig: methodToConfig(method),
			},
		},
	};
};

const toOperatorEntry = (operator: any, index: number, fallbackIndex: number): IndexedWorkflowEntry => {
	const operatorIndex = normalizeIndex(operator?.index, fallbackIndex);
	const path = parseIndexPath(operatorIndex);

	return {
		index: operatorIndex,
		path,
		source: operator,
		node: {
			id: operator?.id ?? `${operator?.type ?? 'operator'}-${index}`,
			type: operator?.type === 'loop' ? 'loop' as const : 'if' as const,
			position: getNodePosition(path),
			data: {
				title: operator?.type === 'loop' ? 'Loop' : 'If',
				subtitle: operator?.expression || operator?.type || 'Condition',
				kind: operator?.type === 'loop' ? 'loop' as const : 'if' as const,
				conditionConfig: {
					operatorType: operator?.type === 'loop' ? 'loop' : 'if',
					tree: {
						id: `${operator?.id ?? index}-group`,
						type: 'group',
						properties: { not: false },
						items: [],
					},
					expression: operator?.expression ?? '',
					...(operator?.iterator ? { iterator: operator.iterator } : {}),
				},
			},
		},
	};
};

const methodsToEntries = (methods: any[], operators: any[]): IndexedWorkflowEntry[] =>
	sortByIndex([
		...methods.map(toMethodEntry),
		...operators.map((operator, index) => toOperatorEntry(operator, index, methods.length + index)),
	]);

const parentIndex = (entry: IndexedWorkflowEntry) => entry.index.split('_').slice(0, -1).join('_');

const isPosition = (position: any) =>
	typeof position?.x === 'number' && typeof position?.y === 'number';

const isViewport = (viewport: any) =>
	typeof viewport?.x === 'number' && typeof viewport?.y === 'number' && typeof viewport?.zoom === 'number';

const getSavedUiNodes = (ui: any): SavedUiNode[] => {
	if (Array.isArray(ui?.workflowNodes)) {
		return ui.workflowNodes
			.map((node: any) => ({
				...node,
				id: node?.id,
				nodeId: node?.nodeId ?? node?.data?.nodeId,
				index: node?.index ?? node?.data?.index,
				color: node?.color ?? node?.data?.color,
				name: node?.name ?? node?.data?.name ?? node?.data?.subtitle,
				type: node?.type,
				position: isPosition(node?.position) ? node.position : { x: node?.x, y: node?.y },
				data: node?.data,
				draggable: node?.draggable,
				deletable: node?.deletable,
			}))
			.filter((node: SavedUiNode) => node.id && isPosition(node.position));
	}

	if (Array.isArray(ui?.flowcharts)) {
		return ui.flowcharts
			.map((node: any) => ({
				id: node?.id ?? node?.flowId,
				position: { x: node?.x, y: node?.y },
			}))
			.filter((node: SavedUiNode) => node.id && isPosition(node.position));
	}

	return [];
};

const getSavedUiEdges = (ui: any): SavedUiEdge[] => {
	const rawEdges = Array.isArray(ui?.workflowEdges)
		? ui.workflowEdges
		: Array.isArray(ui?.flowchartEdges)
			? ui.flowchartEdges
			: [];

	return rawEdges
		.map((edge: any) => ({
			...edge,
			id: edge?.id ?? `edge-${edge?.source}-${edge?.target}-${edge?.sourceHandle ?? 'default'}-${edge?.targetHandle ?? 'default'}`,
			source: edge?.source,
			target: edge?.target,
			sourceHandle: edge?.sourceHandle ?? edge?.data?.branch ?? undefined,
			targetHandle: edge?.targetHandle ?? undefined,
			type: 'workflow-edge' as const,
			data: {
				...(edge?.data ?? {}),
				...((edge?.sourceHandle ?? edge?.data?.branch) === 'true' ? { branch: 'true' as const } : {}),
				...((edge?.sourceHandle ?? edge?.data?.branch) === 'false' ? { branch: 'false' as const } : {}),
			},
		}))
		.filter((edge: SavedUiEdge) => edge.source && edge.target);
};

const getInvalidSavedEdgeReason = (
	nodes: WorkflowNodeModel[],
	edges: SavedUiEdge[],
) => {
	if (!edges.length) return 'empty';

	const nodeIds = new Set(nodes.map((node) => node.id));
	const incoming = new Map<string, number>();
	const outgoingHandles = new Set<string>();

	for (const edge of edges) {
		if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return 'unknown-node';

		const incomingCount = (incoming.get(edge.target) ?? 0) + 1;
		if (incomingCount > 1) return 'duplicate-incoming';
		incoming.set(edge.target, incomingCount);

		const outgoingKey = `${edge.source}:${edge.sourceHandle ?? 'default'}`;
		if (outgoingHandles.has(outgoingKey)) return 'duplicate-outgoing-handle';
		outgoingHandles.add(outgoingKey);
	}
};

const mergeSavedNodeData = (
	builtData: WorkflowNodeModel['data'],
	savedData?: WorkflowNodeModel['data'],
): WorkflowNodeModel['data'] => {
	if (!savedData) return builtData;

	const {
		title,
		subtitle,
		kind,
		connector,
		methodConfig,
		conditionConfig,
		isLeaf,
		rightLeaf,
		bottomLeaf,
		highlighted,
		suppressHoverAddControls,
		lockVisibleAddControls,
	} = savedData;

	return {
		...builtData,
		...(title !== undefined ? { title } : {}),
		...(subtitle !== undefined ? { subtitle } : {}),
		...(kind !== undefined ? { kind } : {}),
		...(connector !== undefined ? { connector } : {}),
		...(methodConfig !== undefined ? { methodConfig } : {}),
		...(conditionConfig !== undefined ? { conditionConfig } : {}),
		...(isLeaf !== undefined ? { isLeaf } : {}),
		...(rightLeaf !== undefined ? { rightLeaf } : {}),
		...(bottomLeaf !== undefined ? { bottomLeaf } : {}),
		...(highlighted !== undefined ? { highlighted } : {}),
		...(suppressHoverAddControls !== undefined ? { suppressHoverAddControls } : {}),
		...(lockVisibleAddControls !== undefined ? { lockVisibleAddControls } : {}),
	};
};

const normalizeMatchValue = (value: unknown) =>
	String(value ?? '').trim().toLowerCase();

const savedTypeMatchesEntry = (savedType: WorkflowNodeModel['type'] | undefined, entryType: WorkflowNodeModel['type']) =>
	!savedType || savedType === entryType || (savedType === 'connector' && entryType === 'system');

const findSavedNode = (
	node: WorkflowNodeModel,
	entry: IndexedWorkflowEntry | undefined,
	savedUiNodes: SavedUiNode[],
	usedSavedNodeIds: Set<string>,
) => {
	const source = entry?.source;
	const matchStages = [
		[[node.id, source?.id, source?.nodeId], (savedNode: SavedUiNode) => [savedNode.id, savedNode.nodeId]],
		[[entry?.index, source?.index], (savedNode: SavedUiNode) => [savedNode.index]],
	] as const;

	for (const [sourceValues, getSavedValues] of matchStages) {
		const candidates = sourceValues.map(normalizeMatchValue).filter(Boolean);
		if (!candidates.length) continue;

		const match = savedUiNodes.find((savedNode) => {
			if (usedSavedNodeIds.has(savedNode.id)) return false;
			if (node.type !== 'start' && !savedTypeMatchesEntry(savedNode.type, node.type)) return false;
			const savedCandidates = getSavedValues(savedNode).map(normalizeMatchValue).filter(Boolean);
			return candidates.some((candidate) => savedCandidates.includes(candidate));
		});
		if (match) return match;
	}

	return undefined;
};

const findEntryForSavedNode = (
	savedNode: SavedUiNode,
	entries: IndexedWorkflowEntry[],
	usedEntryIds: Set<string>,
) => {
	const matchStages = [
		[[savedNode.id, savedNode.nodeId], (entry: IndexedWorkflowEntry) => [entry.node.id, entry.source?.id, entry.source?.nodeId]],
		[[savedNode.index], (entry: IndexedWorkflowEntry) => [entry.index, entry.source?.index]],
	] as const;

	for (const [savedValues, getEntryValues] of matchStages) {
		const candidates = savedValues.map(normalizeMatchValue).filter(Boolean);
		if (!candidates.length) continue;

		const match = entries.find((entry) => {
			if (usedEntryIds.has(entry.node.id)) return false;
			if (!savedTypeMatchesEntry(savedNode.type, entry.node.type)) return false;
			const entryCandidates = getEntryValues(entry).map(normalizeMatchValue).filter(Boolean);
			return candidates.some((candidate) => entryCandidates.includes(candidate));
		});
		if (match) return match;
	}

	return undefined;
};

const restoreNodesFromUi = (
	entries: IndexedWorkflowEntry[],
	savedUiNodes: SavedUiNode[],
) => {
	const usedEntryIds = new Set<string>();
	const restoredNodes = savedUiNodes
		.map((savedNode) => {
			if (savedNode.type === 'start') {
				return {
					...initialNodes[0],
					id: savedNode.id,
					position: savedNode.position,
					data: mergeSavedNodeData(initialNodes[0].data, savedNode.data),
					draggable: savedNode.draggable ?? initialNodes[0].draggable,
					deletable: savedNode.deletable ?? initialNodes[0].deletable,
				};
			}

			const entry = findEntryForSavedNode(savedNode, entries, usedEntryIds);
			if (!entry) {
				return {
					id: savedNode.id,
					type: savedNode.type ?? 'connector',
					position: savedNode.position,
					data: savedNode.data ?? {
						title: '',
						kind: savedNode.type ?? 'connector',
					},
					draggable: savedNode.draggable,
					deletable: savedNode.deletable,
				} as WorkflowNodeModel;
			}
			usedEntryIds.add(entry.node.id);

			return {
				...entry.node,
				id: savedNode.id,
				position: savedNode.position,
				data: {
					...mergeSavedNodeData(entry.node.data, savedNode.data),
					kind: entry.node.data.kind,
					...(entry.node.type === 'system' ? { connector: undefined } : {}),
				},
				draggable: savedNode.draggable ?? entry.node.draggable,
				deletable: savedNode.deletable ?? entry.node.deletable,
			};
		})
		.filter(Boolean) as WorkflowNodeModel[];

	return {
		nodes: restoredNodes.some((node) => node.type === 'start')
			? restoredNodes
			: [initialNodes[0], ...restoredNodes],
		usedEntryIds,
	};
};

const withLeafState = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): WorkflowNodeModel[] => {
	const outgoingByNode = new Map<string, WorkflowEdgeModel[]>();

	edges.forEach((edge) => {
		outgoingByNode.set(edge.source, [...(outgoingByNode.get(edge.source) ?? []), edge]);
	});

	return nodes.map((node) => {
		const outgoing = outgoingByNode.get(node.id) ?? [];
		const rightHandle = getRightSourceHandle(node.type);
		const bottomHandle = getBottomSourceHandle(node.type);
		const hasRightEdge = outgoing.some((edge) => (edge.sourceHandle ?? undefined) === rightHandle);
		const hasBottomEdge = outgoing.some((edge) => (edge.sourceHandle ?? undefined) === bottomHandle);

		if (node.type === 'if' || node.type === 'loop') {
			return {
				...node,
				data: {
					...node.data,
					rightLeaf: !hasRightEdge,
					bottomLeaf: !hasBottomEdge,
					isLeaf: outgoing.length === 0,
				},
			};
		}

		return {
			...node,
			data: {
				...node.data,
				isLeaf: outgoing.length === 0,
			},
		};
	});
};

const buildEdge = (
	source: WorkflowNodeModel,
	target: WorkflowNodeModel,
	direction: 'right' | 'bottom',
): WorkflowEdgeModel => {
	const sourceHandle = direction === 'bottom'
		? getBottomSourceHandle(source.type)
		: getRightSourceHandle(source.type);
	const targetHandle = direction === 'bottom' ? 'top' : 'left';
	const branch = source.type === 'if'
		? sourceHandle === 'true' ? 'true' as const : sourceHandle === 'false' ? 'false' as const : undefined
		: undefined;

	return {
		id: `edge-${source.id}-${target.id}-${sourceHandle ?? 'default'}-${targetHandle}`,
		source: source.id,
		target: target.id,
		sourceHandle,
		targetHandle,
		type: 'workflow-edge',
		...(branch ? { data: { branch } } : {}),
	};
};

const buildEdges = (entries: IndexedWorkflowEntry[]): WorkflowEdgeModel[] => {
	const startNode = initialNodes[0];
	const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));
	const rootEntries = sortByIndex(entries.filter((entry) => entry.path.length === 1));
	const nestedGroups = new Map<string, IndexedWorkflowEntry[]>();
	const edges: WorkflowEdgeModel[] = [];

	rootEntries.forEach((entry, index) => {
		const source = index === 0 ? startNode : rootEntries[index - 1]?.node;
		if (source) edges.push(buildEdge(source, entry.node, 'right'));
	});

	entries
		.filter((entry) => entry.path.length > 1)
		.forEach((entry) => {
			const parent = parentIndex(entry);
			nestedGroups.set(parent, [...(nestedGroups.get(parent) ?? []), entry]);
		});

	nestedGroups.forEach((children, parent) => {
		const parentEntry = entryByIndex.get(parent);
		if (!parentEntry || (parentEntry.node.type !== 'if' && parentEntry.node.type !== 'loop')) return;

		const sortedChildren = sortByIndex(children);
		sortedChildren.forEach((entry, index) => {
			const source = index === 0 ? parentEntry.node : sortedChildren[index - 1]?.node;
			if (source) edges.push(buildEdge(source, entry.node, index === 0 ? 'bottom' : 'right'));
		});
	});

	return edges;
};

const assignMissingMethodColors = (list: WorkflowNodeModel[]): WorkflowNodeModel[] => {
	const usedColors = new Set<string>();
	list.forEach((node) => {
		if (node.type !== 'connector' && node.type !== 'system') return;
		const raw = typeof node.data.color === 'string' ? node.data.color.trim() : '';
		if (raw) usedColors.add(raw.toLowerCase());
	});
	return list.map((node) => {
		if (node.type !== 'connector' && node.type !== 'system') return node;
		const raw = typeof node.data.color === 'string' ? node.data.color.trim() : '';
		if (raw) return node;
		const free = ALL_COLORS.find((color) => !usedColors.has(color.toLowerCase()))
			?? ALL_COLORS[usedColors.size % ALL_COLORS.length];
		usedColors.add(free.toLowerCase());
		return { ...node, data: { ...node.data, color: free } };
	});
};

const hasStackedNodes = (list: WorkflowNodeModel[]) => {
	const placed = list.filter((node) => node.type !== 'start');
	for (let i = 0; i < placed.length; i += 1) {
		for (let j = i + 1; j < placed.length; j += 1) {
			if (Math.abs(placed[i].position.x - placed[j].position.x) < 40
				&& Math.abs(placed[i].position.y - placed[j].position.y) < 40) {
				return true;
			}
		}
	}
	return false;
};

export function mapConnectionToWorkflowState(
	payload: unknown,
	fallbackViewport?: { x: number; y: number; zoom: number },
): WorkflowConnectionState {
	const connection = normalizeConnectionPayload(payload);
	const methods = connection.fromConnector.method ?? [];
	const operators = connection.fromConnector.operator ?? [];
	const entries = methodsToEntries(methods, operators);
	const savedUiNodes = getSavedUiNodes(connection.ui);
	const savedViewport = isViewport(connection.ui?.viewport) ? connection.ui.viewport : fallbackViewport;
	const savedUiEdges = getSavedUiEdges(connection.ui);
	const shouldRestoreFromUi = entries.length > 0 && savedUiNodes.length > 0 && savedUiEdges.length > 0;
	const restoredFromUi = shouldRestoreFromUi ? restoreNodesFromUi(entries, savedUiNodes) : undefined;
	const builtNodes = restoredFromUi?.nodes ?? (entries.length ? [...initialNodes, ...entries.map((entry) => entry.node)] : initialNodes);
	const entryByNodeId = new Map(entries.map((entry) => [entry.node.id, entry]));
	const usedSavedNodeIds = new Set<string>();
	const nodes = restoredFromUi ? builtNodes : builtNodes.map((node) => {
		const savedNode = findSavedNode(node, entryByNodeId.get(node.id), savedUiNodes, usedSavedNodeIds);
		if (!savedNode) return node;
		usedSavedNodeIds.add(savedNode.id);

		return {
			...node,
			id: node.type === 'start' ? node.id : savedNode.id,
			position: savedNode.position,
			data: mergeSavedNodeData(node.data, savedNode.data),
			draggable: savedNode.draggable ?? node.draggable,
			deletable: savedNode.deletable ?? node.deletable,
		};
	});
	const invalidSavedEdgeReason = getInvalidSavedEdgeReason(nodes, savedUiEdges);
	const useSavedEdges = restoredFromUi
		? savedUiEdges.length > 0
		: entries.length > 0 && savedUiEdges.length > 0 && !invalidSavedEdgeReason;
	const edges = useSavedEdges ? savedUiEdges : entries.length ? buildEdges(entries) : initialEdges;
	const shouldAutoLayout = entries.length > 0
		&& ((!restoredFromUi && savedUiNodes.length === 0) || hasStackedNodes(nodes));
	const positionedNodes = shouldAutoLayout ? normalizeWorkflowPositions(nodes, edges) : nodes;
	const normalizedNodes = withLeafState(assignMissingMethodColors(positionedNodes), edges);

	return {
		title: connection.title,
		description: connection.description ?? '',
		nodes: normalizedNodes,
		edges,
		fieldBindings: Array.isArray(connection.fieldBinding)
			? connection.fieldBinding
			: Array.isArray(connection.fieldBindings)
				? connection.fieldBindings
				: [],
		versions: [],
		viewport: savedViewport,
	};
}
