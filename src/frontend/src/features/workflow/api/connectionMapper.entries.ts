import { MethodType } from '../types/connection';
import type { WorkflowMethodConfig } from '../types/request-config.types';
import type { WorkflowCreateKind } from '../types/workflow.types';
import type { ConditionChild, ConditionGroup, ConditionGroupProperties,
	ConditionRuleProperties } from '../components/condition-builder/conditionBuilder.types';
import { createConditionId } from '../components/condition-builder/conditionTreeFactory';
import { initialNodes } from '../data/initialGraph';
import { OFFSETS, TITLES } from '../utils/graph.constants';
import type { IndexedWorkflowEntry } from './connectionMapper.types';

type LegacyConditionNode = {
	id?: string;
	type?: 'group' | 'rule';
	properties?: Record<string, unknown>;
	items?: LegacyConditionNode[];
};

const unwrapLegacyField = (value: unknown) => {
	if (typeof value !== 'string') return value;
	const match = value.match(/^\{%(.+)%\}$/);
	return match ? match[1] : value;
};

const normalizeLegacyConditionChild = (node: LegacyConditionNode): ConditionChild => {
	if (node.type === 'rule') return {
		id: node.id ?? createConditionId('rule'), type: 'rule',
		properties: {
			...node.properties,
			leftField: unwrapLegacyField(node.properties?.leftField),
			...(node.properties?.rightField === '&nbsp'
				? { rightField: undefined }
				: { rightField: unwrapLegacyField(node.properties?.rightField) }),
		} as ConditionRuleProperties,
	};
	return normalizeLegacyConditionTree(node);
};

const normalizeLegacyConditionTree = (node: LegacyConditionNode): ConditionGroup => ({
	id: node.id ?? createConditionId('group'), type: 'group',
	properties: (node.properties ?? { not: false }) as ConditionGroupProperties,
	items: node.items?.map(normalizeLegacyConditionChild),
});

const normalizeIndex = (value: unknown, fallback: number) =>
	value === undefined || value === null || value === '' ? String(fallback) : String(value);
const parsePath = (value: unknown) => String(value ?? '').split('_')
	.map(Number).map((part) => Number.isFinite(part) ? part : 0);
const comparePath = (left: number[], right: number[]) => {
	const length = Math.max(left.length, right.length);
	for (let index = 0; index < length; index += 1) {
		const difference = (left[index] ?? -1) - (right[index] ?? -1);
		if (difference) return difference;
	}
	return left.length - right.length;
};
const getPosition = (path: number[]) => {
	const start = initialNodes[0]?.position ?? { x: 120, y: 220 };
	const [rootOrder = 0, ...nested] = path;
	return {
		x: start.x + OFFSETS.right.x * (rootOrder + 1 + nested.reduce((sum, part) => sum + part, 0)),
		y: start.y + OFFSETS.bottom.y * nested.length,
	};
};
type MethodNodeKind = Extract<
	WorkflowCreateKind,
	'connector' | 'system' | 'trigger-connection'
>;

const methodKind = (method: any): MethodNodeKind => {
	switch (method?.methodType) {
		case MethodType.HttpRequest: return 'system';
		case MethodType.Webhook: return 'trigger-connection';
		default: return 'connector';
	}
};
const methodConfig = (method: any): WorkflowMethodConfig => ({
	name: method?.name,
	url: method?.request?.endpoint ?? '', method: method?.request?.method ?? 'GET',
	headers: method?.request?.header ?? {}, queryParams: method?.request?.queryParams ?? [],
	endpointArgs: method?.request?.endpointArgs ?? {},
	bodyFormat: method?.request?.body?.format ?? 'json',
	bodyData: method?.request?.body?.data ?? 'raw', body: method?.request?.body?.fields ?? {},
	response: method?.response,
});

const toMethodEntry = (method: any, index: number): IndexedWorkflowEntry => {
	const entryIndex = normalizeIndex(method?.index, index);
	const kind = methodKind(method);
	const hasConnector = kind === 'connector';
	return { index: entryIndex, path: parsePath(entryIndex), source: method, node: {
		id: method?.id ?? `method-${index}`, type: kind, position: getPosition(parsePath(entryIndex)),
		data: {
			title: hasConnector ? method?.connector?.title ?? 'Connector' : TITLES[kind],
			subtitle: method?.label ?? method?.name ?? `Method ${index + 1}`,
			labelEdited: Boolean(method?.label), kind, color: method?.color,
			// The backend renamed this property from `jumpTo` to `jump`; the old name
			// is still read so connections saved before the rename keep their joints.
			...(method?.jump ?? method?.jumpTo
				? { jump: String(method.jump ?? method.jumpTo) } : {}),
			...(hasConnector ? { connector: {
				connectorId: method?.connector?.connectorId ?? -1,
				title: method?.connector?.title ?? 'DEFAULT', icon: method?.connector?.icon ?? null,
				invokerName: method?.connector?.invokerName ?? method?.invokerName ?? null,
			} } : {}),
			dataAggregator: method?.dataAggregator ?? undefined, methodConfig: methodConfig(method),
		},
	} };
};

const toOperatorEntry = (operator: any, index: number, fallback: number,
	legacyOperators: LegacyConditionNode[]): IndexedWorkflowEntry => {
	const entryIndex = normalizeIndex(operator?.index, fallback);
	const type = operator?.type === 'loop' ? 'loop' as const : 'if' as const;
	const legacyTree = legacyOperators.find((tree) => tree.id === operator?.uiId);
	return { index: entryIndex, path: parsePath(entryIndex), source: operator, node: {
		id: operator?.id ?? operator?.uiId ?? `${operator?.type ?? 'operator'}-${index}`, type,
		position: getPosition(parsePath(entryIndex)), data: {
			title: type === 'loop' ? 'Loop' : 'If',
			subtitle: operator?.expression || operator?.type || 'Condition', kind: type,
			dataAggregator: operator?.dataAggregator ?? undefined,
			conditionConfig: { operatorType: type,
				tree: legacyTree?.type === 'group'
					? normalizeLegacyConditionTree(legacyTree)
					: { id: `${operator?.id ?? operator?.uiId ?? index}-group`, type: 'group',
						properties: { not: false }, items: [] },
				expression: operator?.expression ?? '',
				...(operator?.iterator ? { iterator: operator.iterator } : {}) },
		},
	} };
};

export const methodsToEntries = (methods: any[], operators: any[], legacyOperators: LegacyConditionNode[] = []) => [
	...methods.map(toMethodEntry),
	...operators.map((operator, index) => toOperatorEntry(operator, index, methods.length + index, legacyOperators)),
].sort((left, right) => comparePath(left.path, right.path));
