import type { Connection, MethodWithId } from '../../types/connection';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { ITERATOR_NAMES } from '../request-editor/body-editor/requestReferenceOptions';
import type { ConditionGroup } from './conditionBuilder.types';

export const buildNodeBackedMethods = (
	methods: MethodWithId[],
	nodes: WorkflowNodeModel[],
) => {
	const methodsById = new Map(methods.map((method) => [method.id, method]));
	return nodes.filter((node) => ['connector', 'system', 'trigger-connection'].includes(node.type))
		.map((node) => {
			const method = methodsById.get(node.id);
			const label = node.data.subtitle || node.data.title ||
				method?.label || method?.name || node.id;
			return {
				...(method ?? {
					id: node.id, index: '', name: label, label,
					connector: node.type === 'system' || node.type === 'trigger-connection'
						? null : node.data.connector ?? null,
					request: {}, response: {},
				}),
				color: node.data.color ?? method?.color ?? '',
				name: method?.name || label,
				label: method?.label || label,
			} as MethodWithId;
		});
};

const parseWorkflowIndex = (value: unknown) => String(value ?? '').split('_')
	.map(Number).map((part) => Number.isFinite(part) ? part : 0);

const compareWorkflowIndex = (left?: unknown, right?: unknown) => {
	const leftPath = parseWorkflowIndex(left);
	const rightPath = parseWorkflowIndex(right);
	for (let index = 0; index < Math.max(leftPath.length, rightPath.length); index += 1) {
		const difference = (leftPath[index] ?? -1) - (rightPath[index] ?? -1);
		if (difference) return difference;
	}
	return leftPath.length - rightPath.length;
};

export const getSourceMethods = (
	connection: Connection,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	node: WorkflowNodeModel | null,
) => {
	const methods = connection.fromConnector.method;
	if (!node) return methods;
	if (edges.length > 0) {
		const canReach = (fromId: string, targetId: string) => {
			const visited = new Set<string>();
			const stack = [fromId];
			while (stack.length) {
				const current = stack.pop();
				if (!current || visited.has(current)) continue;
				if (current === targetId) return true;
				visited.add(current);
				edges.forEach((edge) => {
					if (edge.source === current && !visited.has(edge.target)) stack.push(edge.target);
				});
			}
			return false;
		};
		return methods.filter((method) => canReach(method.id, node.id));
	}
	const operator = connection.fromConnector.operator.find((item) => item.id === node.id);
	if (operator?.index !== undefined) {
		return methods.filter((method) => compareWorkflowIndex(method.index, operator.index) < 0);
	}
	const nodeIndex = nodes.findIndex((item) => item.id === node.id);
	if (nodeIndex < 0) return methods;
	const allowedIds = new Set(nodes.slice(0, nodeIndex)
		.filter((item) => ['connector', 'system', 'trigger-connection'].includes(item.type))
		.map((item) => item.id));
	return methods.filter((method) => allowedIds.has(method.id));
};

const getCurrentOperator = (connection: Connection, node: WorkflowNodeModel | null) =>
	node ? connection.fromConnector.operator.find((operator) => operator.id === node.id) : undefined;
const getLoopAncestors = (connection: Connection, node: WorkflowNodeModel | null) => {
	const currentIndex = getCurrentOperator(connection, node)?.index;
	if (!currentIndex) return [];
	return connection.fromConnector.operator.filter((operator) => operator.type === 'loop' &&
		operator.index !== currentIndex && currentIndex.startsWith(`${operator.index}_`))
		.sort((left, right) => left.index.split('_').length - right.index.split('_').length);
};

export const getPreviousIterators = (connection: Connection, node: WorkflowNodeModel | null) =>
	getLoopAncestors(connection, node)
		.map((operator, index) => (operator as any).iterator || ITERATOR_NAMES[index])
		.filter((iterator): iterator is string => !!iterator);

export const getCurrentLoopIterator = (connection: Connection, node: WorkflowNodeModel | null) => {
	if (node?.type !== 'loop') return undefined;
	return node.data.conditionConfig?.iterator || (getCurrentOperator(connection, node) as any)?.iterator ||
		ITERATOR_NAMES[getLoopAncestors(connection, node).length];
};

const findFirstRuleValue = (group: ConditionGroup, key: 'leftField' | 'operator'): string | undefined => {
	for (const item of group.items ?? []) {
		if (item.type === 'rule' && item.properties?.[key]) return item.properties[key];
		if (item.type !== 'rule') {
			const nested = findFirstRuleValue(item, key);
			if (nested) return nested;
		}
	}
	return undefined;
};
export const getFirstRuleLeftField = (group: ConditionGroup) => findFirstRuleValue(group, 'leftField');
export const getFirstRuleOperator = (group: ConditionGroup) => findFirstRuleValue(group, 'operator');
