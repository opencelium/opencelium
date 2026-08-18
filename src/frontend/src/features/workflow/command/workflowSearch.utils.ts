import Fuse from 'fuse.js';
import type { Node } from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflow.types';

const METHOD_NODE_KINDS: WorkflowNodeType[] = ['connector', 'system', 'trigger-connection'];
const OPERATOR_NODE_KINDS: WorkflowNodeType[] = ['if', 'loop'];

const isMethodNode = (node: Node<WorkflowNodeData>): boolean => METHOD_NODE_KINDS.includes(node.data.kind);
const isOperatorNode = (node: Node<WorkflowNodeData>): boolean => OPERATOR_NODE_KINDS.includes(node.data.kind);

type WorkflowSearchRecord = {
	nodeId: string;
	label: string;
	name: string;
	url: string;
	headers: string;
	queryParams: string;
	requestBody: string;
	responseBody: string;
	responseHeaders: string;
	condition: string;
};

/** Recursively joins every key and primitive leaf value into one searchable
 * string — covers both `{"objID": "..."}` (key match) and templated values
 * like `#FFCFB5.(response)...` (value match) without needing a schema. */
const flattenToText = (value: unknown, tokens: string[] = []): string[] => {
	if (value === null || value === undefined) return tokens;
	if (Array.isArray(value)) {
		value.forEach((item) => flattenToText(item, tokens));
		return tokens;
	}
	if (typeof value === 'object') {
		Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
			tokens.push(key);
			flattenToText(nested, tokens);
		});
		return tokens;
	}
	tokens.push(String(value));
	return tokens;
};

const joinHeaders = (headers?: Record<string, string>): string =>
	Object.entries(headers ?? {}).map(([key, value]) => `${key} ${value}`).join(' ');

const buildMethodRecord = (node: Node<WorkflowNodeData>): WorkflowSearchRecord => {
	const config = node.data.methodConfig;
	const response = config?.response;
	const label = node.data.subtitle ?? node.data.title ?? '';

	return {
		nodeId: node.id,
		label,
		name: label,
		url: config?.url ?? '',
		headers: joinHeaders(config?.headers),
		queryParams: (config?.queryParams ?? []).map((param) => `${param.key} ${param.value}`).join(' '),
		requestBody: flattenToText(config?.body).join(' '),
		responseBody: flattenToText(response?.success?.body?.fields)
			.concat(flattenToText(response?.fail?.body?.fields))
			.join(' '),
		responseHeaders: `${joinHeaders(response?.success?.header)} ${joinHeaders(response?.fail?.header)}`,
		condition: '',
	};
};

const buildOperatorRecord = (node: Node<WorkflowNodeData>): WorkflowSearchRecord => {
	const condition = [node.data.conditionConfig?.expression, node.data.conditionConfig?.iterator]
		.filter(Boolean)
		.join(' ');

	return {
		nodeId: node.id,
		label: `${node.data.title ?? 'Condition'}: ${condition}`.trim(),
		name: node.data.title ?? '',
		url: '',
		headers: '',
		queryParams: '',
		requestBody: '',
		responseBody: '',
		responseHeaders: '',
		condition,
	};
};

const buildSearchRecords = (nodes: Node<WorkflowNodeData>[]): WorkflowSearchRecord[] =>
	nodes
		.filter((node) => isMethodNode(node) || isOperatorNode(node))
		.map((node) => (isMethodNode(node) ? buildMethodRecord(node) : buildOperatorRecord(node)));

const SEARCH_KEYS: { name: keyof WorkflowSearchRecord; weight: number }[] = [
	{ name: 'name', weight: 0.35 },
	{ name: 'url', weight: 0.2 },
	{ name: 'condition', weight: 0.2 },
	{ name: 'headers', weight: 0.1 },
	{ name: 'queryParams', weight: 0.1 },
	{ name: 'requestBody', weight: 0.08 },
	{ name: 'responseBody', weight: 0.06 },
	{ name: 'responseHeaders', weight: 0.03 },
];

export type WorkflowSearchMatch = {
	node: Node<WorkflowNodeData>;
	/** Method name, or `"If: <condition>"` / `"Loop: <condition>"` for operators — shown in the command-palette suggestion dropdown. */
	label: string;
};

/** Fuzzy-matches methods (name, url, headers, query params, request/response
 * bodies) and if/loop operators (condition expression) against `term`,
 * returning the matched nodes ordered best-match-first. */
export const searchWorkflowNodes = (nodes: Node<WorkflowNodeData>[], term: string): WorkflowSearchMatch[] => {
	const needle = term.trim();
	if (!needle) return [];

	const records = buildSearchRecords(nodes);
	const recordById = new Map(records.map((record) => [record.nodeId, record]));
	const fuse = new Fuse(records, {
		keys: SEARCH_KEYS,
		threshold: 0.35,
		ignoreLocation: true,
		minMatchCharLength: 2,
	});
	const nodeById = new Map(nodes.map((node) => [node.id, node]));

	return fuse
		.search(needle)
		.map((result) => {
			const node = nodeById.get(result.item.nodeId);
			const record = recordById.get(result.item.nodeId);
			return node && record ? { node, label: record.label } : undefined;
		})
		.filter((match): match is WorkflowSearchMatch => Boolean(match));
};
