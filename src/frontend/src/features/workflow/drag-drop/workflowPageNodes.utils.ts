import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import { ALL_COLORS } from '../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export const stabilizeMethodColors = (nodes: WorkflowNodeModel[]) => {
	let methodIndex = 0;
	const usedColors = new Set<string>();
	return nodes.map((node) => {
		if (node.type !== 'connector' && node.type !== 'system') return node;
		let color = node.data.color;
		if (!color || usedColors.has(color.toLowerCase())) {
			color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
				?? ALL_COLORS[methodIndex % ALL_COLORS.length];
		}
		usedColors.add(color.toLowerCase());
		methodIndex += 1;
		return node.data.color === color ? node : {
			...node,
			data: { ...node.data, color },
		};
	});
};

export const restoreStableNodeData = (
	nextNodes: WorkflowNodeModel[],
	previousNodes: WorkflowNodeModel[],
	operatorConfigs?: Map<string, ConditionConfig>,
) => {
	const previousById = new Map(stabilizeMethodColors(previousNodes)
		.map((node) => [node.id, node]));
	return nextNodes.map((node) => {
		const previous = previousById.get(node.id);
		if (node.type === 'connector' || node.type === 'system') {
			const color = previous?.data.color ?? node.data.color;
			return !color ? node : { ...node, data: { ...node.data, color } };
		}
		if (node.type !== 'if' && node.type !== 'loop') return node;
		const conditionConfig = node.data.conditionConfig
			?? operatorConfigs?.get(node.id)
			?? previous?.data.conditionConfig;
		return !conditionConfig ? node : {
			...node,
			data: { ...node.data, conditionConfig },
		};
	});
};

export const clearDragFlags = (nodes: WorkflowNodeModel[]) => nodes.map((node) => ({
	...node,
	data: {
		...node.data,
		highlighted: false,
		dropTarget: false,
		dropInvalid: false,
		hideAddControls: false,
		suppressHoverAddControls: false,
		lockVisibleAddControls: false,
		dragSourceMoving: false,
		dragSourceFaint: false,
	},
}));

export const clearDragPreviewNodes = (nodes: WorkflowNodeModel[]) =>
	nodes.filter((node) => !node.data.dragGhost && !node.data.dropPlaceholder);
export const clearDragPreviewEdges = (edges: WorkflowEdgeModel[]) =>
	edges.filter((edge) => !edge.data?.dragGhost && !edge.data?.dropPlaceholder);
export const clearEdgeDragFlags = (edges: WorkflowEdgeModel[]) => edges.map((edge) => ({
	...edge,
	data: { ...edge.data, highlighted: false, dropTarget: false, dropInvalid: false },
}));
