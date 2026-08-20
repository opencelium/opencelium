import { ALL_COLORS } from '../constants/colors';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { IndexedWorkflowEntry } from './connectionMapper.types';

export const assignMissingMethodColors = (nodes: WorkflowNodeModel[]) => {
	const usedColors = new Set<string>();
	nodes.forEach((node) => {
		if (node.type !== 'connector' && node.type !== 'system') return;
		const color = typeof node.data.color === 'string' ? node.data.color.trim() : '';
		if (color) usedColors.add(color.toLowerCase());
	});
	return nodes.map((node) => {
		if (node.type !== 'connector' && node.type !== 'system') return node;
		const color = typeof node.data.color === 'string' ? node.data.color.trim() : '';
		if (color) return node;
		const free = ALL_COLORS.find((item) => !usedColors.has(item.toLowerCase()))
			?? ALL_COLORS[usedColors.size % ALL_COLORS.length];
		usedColors.add(free.toLowerCase());
		return { ...node, data: { ...node.data, color: free } };
	});
};

// Comments are positioned by hand and may deliberately sit on top of the graph,
// so they must never be the reason the whole graph gets re-laid out on load.
export const hasStackedNodes = (nodes: WorkflowNodeModel[]) => {
	const placed = nodes.filter((node) => node.type !== 'start' && node.type !== 'comment');
	for (let left = 0; left < placed.length; left += 1) {
		for (let right = left + 1; right < placed.length; right += 1) {
			if (Math.abs(placed[left].position.x - placed[right].position.x) < 40
				&& Math.abs(placed[left].position.y - placed[right].position.y) < 40) {
				return true;
			}
		}
	}
	return false;
};

export const backfillMissingInvokerNames = (
	nodes: WorkflowNodeModel[],
	entries: IndexedWorkflowEntry[],
) => {
	const invokerByConnectorId = new Map<number, string>();
	entries.forEach((entry) => {
		const connector = entry.node.data.connector;
		if (connector && connector.connectorId !== -1 && connector.invokerName) {
			invokerByConnectorId.set(connector.connectorId, connector.invokerName);
		}
	});
	if (invokerByConnectorId.size === 0) return nodes;
	return nodes.map((node) => {
		const connector = node.data.connector;
		if (!connector || connector.invokerName) return node;
		const invokerName = invokerByConnectorId.get(connector.connectorId);
		return invokerName
			? { ...node, data: { ...node.data, connector: { ...connector, invokerName } } }
			: node;
	});
};
