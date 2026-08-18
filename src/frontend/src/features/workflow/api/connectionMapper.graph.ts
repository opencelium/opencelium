import { initialNodes } from '../data/initialGraph';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { getBottomSourceHandle, getRightSourceHandle } from '../utils/graph.handles';
import type { IndexedWorkflowEntry } from './connectionMapper.types';

const comparePath = (left: number[], right: number[]) => {
	const length = Math.max(left.length, right.length);
	for (let index = 0; index < length; index += 1) {
		const difference = (left[index] ?? -1) - (right[index] ?? -1);
		if (difference) return difference;
	}
	return left.length - right.length;
};
const sortEntries = (entries: IndexedWorkflowEntry[]) =>
	[...entries].sort((left, right) => comparePath(left.path, right.path));

const buildEdge = (
	source: WorkflowNodeModel,
	target: WorkflowNodeModel,
	direction: 'right' | 'bottom',
): WorkflowEdgeModel => {
	const sourceHandle = direction === 'bottom'
		? getBottomSourceHandle(source.type) : getRightSourceHandle(source.type);
	const targetHandle = direction === 'bottom' ? 'top' : 'left';
	const branch = source.type === 'if'
		? sourceHandle === 'true' ? 'true' as const
			: sourceHandle === 'false' ? 'false' as const : undefined
		: undefined;
	return {
		id: `edge-${source.id}-${target.id}-${sourceHandle ?? 'default'}-${targetHandle}`,
		source: source.id, target: target.id, sourceHandle, targetHandle,
		type: 'workflow-edge', ...(branch ? { data: { branch } } : {}),
	};
};

export const buildWorkflowEdges = (entries: IndexedWorkflowEntry[]): WorkflowEdgeModel[] => {
	const entryByIndex = new Map(entries.map((entry) => [entry.index, entry]));
	const rootEntries = sortEntries(entries.filter((entry) => entry.path.length === 1));
	const nestedGroups = new Map<string, IndexedWorkflowEntry[]>();
	const edges: WorkflowEdgeModel[] = [];
	rootEntries.forEach((entry, index) => {
		const source = index === 0 ? initialNodes[0] : rootEntries[index - 1]?.node;
		if (source) edges.push(buildEdge(source, entry.node, 'right'));
	});
	entries.filter((entry) => entry.path.length > 1).forEach((entry) => {
		const parent = entry.index.split('_').slice(0, -1).join('_');
		nestedGroups.set(parent, [...(nestedGroups.get(parent) ?? []), entry]);
	});
	nestedGroups.forEach((children, parent) => {
		const parentEntry = entryByIndex.get(parent);
		if (!parentEntry || !['if', 'loop'].includes(parentEntry.node.type ?? '')) return;
		const sortedChildren = sortEntries(children);
		sortedChildren.forEach((entry, index) => {
			const source = index === 0 ? parentEntry.node : sortedChildren[index - 1]?.node;
			if (source) edges.push(buildEdge(source, entry.node, index === 0 ? 'bottom' : 'right'));
		});
	});
	return edges;
};

export const applyWorkflowLeafState = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const outgoingByNode = new Map<string, WorkflowEdgeModel[]>();
	edges.forEach((edge) => outgoingByNode.set(
		edge.source, [...(outgoingByNode.get(edge.source) ?? []), edge],
	));
	return nodes.map((node) => {
		const outgoing = outgoingByNode.get(node.id) ?? [];
		if (node.type !== 'if' && node.type !== 'loop') {
			return { ...node, data: { ...node.data, isLeaf: outgoing.length === 0 } };
		}
		const rightHandle = getRightSourceHandle(node.type);
		const bottomHandle = getBottomSourceHandle(node.type);
		return { ...node, data: { ...node.data,
			rightLeaf: !outgoing.some((edge) => (edge.sourceHandle ?? undefined) === rightHandle),
			bottomLeaf: !outgoing.some((edge) => (edge.sourceHandle ?? undefined) === bottomHandle),
			isLeaf: outgoing.length === 0 } };
	});
};
