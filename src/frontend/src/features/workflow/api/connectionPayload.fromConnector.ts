import { ALL_COLORS } from '../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowIndexes } from './connectionPayload.indexes';
import { buildMethodPayload } from './connectionPayload.methods';
import { buildOperatorPayload, getLoopIterator } from './connectionPayload.operators';

const nodeKind = (node: WorkflowNodeModel) => node.type;
const isMethodNode = (node: WorkflowNodeModel) => {
	const kind = nodeKind(node);
	return kind === 'connector' || kind === 'system' || kind === 'trigger-connection';
};
const isOperatorNode = (node: WorkflowNodeModel) => ['if', 'loop'].includes(nodeKind(node));
const parseIndex = (value: unknown) => String(value ?? '')
	.split('_')
	.map(Number)
	.map((part) => (Number.isFinite(part) ? part : 0));
const compareIndex = (left: { index?: unknown }, right: { index?: unknown }) => {
	const leftPath = parseIndex(left.index);
	const rightPath = parseIndex(right.index);
	const length = Math.max(leftPath.length, rightPath.length);
	for (let index = 0; index < length; index += 1) {
		const difference = (leftPath[index] ?? -1) - (rightPath[index] ?? -1);
		if (difference) return difference;
	}
	return leftPath.length - rightPath.length;
};

/**
 * Payload index per operator node — the value the backend echoes back in
 * validation errors (`Operator (index=1, type=loop) ...`), so resolving such an
 * error to a node has to invert *this* map rather than the whole-graph one:
 * an operator the walk never reaches falls back to a synthetic index that can
 * collide with a method node's real one.
 */
export const buildOperatorIndexes = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const methodCount = nodes.filter(isMethodNode).length;
	return new Map(nodes
		.filter(isOperatorNode)
		.map((node, index) => [node.id, indexes.get(node.id) ?? String(methodCount + index)]));
};

export const buildFromConnectorPayload = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	options?: { includeInvoker?: boolean },
) => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const methodNodes = nodes.filter(isMethodNode);
	const usedColors = new Set(methodNodes
		.map((node) => typeof node.data.color === 'string' ? node.data.color.trim() : '')
		.filter(Boolean)
		.map((color) => color.toLowerCase()));
	const colorByNodeId = new Map<string, string>();
	methodNodes.forEach((node) => {
		const raw = typeof node.data.color === 'string' ? node.data.color.trim() : '';
		const color = raw || ALL_COLORS.find((item) => !usedColors.has(item.toLowerCase()))
			|| ALL_COLORS[colorByNodeId.size % ALL_COLORS.length];
		usedColors.add(color.toLowerCase());
		colorByNodeId.set(node.id, color);
	});
	const methods = methodNodes.map((node, index) => buildMethodPayload(
		node,
		typeof indexes.get(node.id) === 'string' ? indexes.get(node.id)! : String(index),
		index,
		colorByNodeId.get(node.id),
		options?.includeInvoker,
	)).sort(compareIndex);
	const operatorIndexes = buildOperatorIndexes(nodes, edges);
	const operatorEntries = nodes
		.filter(isOperatorNode)
		.map((node) => ({ node, index: operatorIndexes.get(node.id)! }))
		.sort(compareIndex);
	const builtOperators: Array<{ index: string; type: string; iterator?: string }> = [];
	const operators = operatorEntries.map(({ node, index }) => {
		const iterator = nodeKind(node) === 'loop'
			? getLoopIterator(node, index, builtOperators)
			: undefined;
		const operator = buildOperatorPayload(node, index, iterator);
		builtOperators.push(operator);
		return operator;
	}).sort(compareIndex);
	return { connectorId: -1, title: 'DEFAULT', methods, operators };
};
