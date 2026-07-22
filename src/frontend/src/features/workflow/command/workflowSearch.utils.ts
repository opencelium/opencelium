import type { Node } from '@xyflow/react';
import type { WorkflowNodeData, WorkflowNodeType } from '../types/workflow.types';

const METHOD_NODE_KINDS: WorkflowNodeType[] = ['connector', 'system', 'trigger-connection'];

const isMethodNode = (node: Node<WorkflowNodeData>): boolean => METHOD_NODE_KINDS.includes(node.data.kind);

export const matchNodesByMethodName = (nodes: Node<WorkflowNodeData>[], term: string): Node<WorkflowNodeData>[] => {
	const needle = term.trim().toLowerCase();
	if (!needle) return [];
	return nodes.filter((node) => {
		if (!isMethodNode(node)) return false;
		const label = (node.data.subtitle ?? node.data.title ?? '').toLowerCase();
		return label.includes(needle);
	});
};

const URL_PATH_PARAM_PATTERN = /\{([^}/]+)\}/g;

const collectUrlParamNames = (url: string): string[] => {
	const names: string[] = [];
	let match: RegExpExecArray | null;
	URL_PATH_PARAM_PATTERN.lastIndex = 0;
	while ((match = URL_PATH_PARAM_PATTERN.exec(url)) !== null) {
		names.push(match[1]);
	}
	const [, queryString] = url.split('?');
	if (queryString) {
		names.push(...Array.from(new URLSearchParams(queryString).keys()));
	}
	return names;
};

const collectBodyKeys = (value: unknown, keys: string[] = []): string[] => {
	if (Array.isArray(value)) {
		value.forEach((item) => collectBodyKeys(item, keys));
	} else if (value && typeof value === 'object') {
		Object.entries(value as Record<string, unknown>).forEach(([key, nested]) => {
			keys.push(key);
			collectBodyKeys(nested, keys);
		});
	}
	return keys;
};

const collectPropertyNames = (node: Node<WorkflowNodeData>): string[] => {
	const config = node.data.methodConfig;
	if (!config) return [];
	return [
		...Object.keys(config.headers ?? {}),
		...(config.queryParams ?? []).map((param) => param.key),
		...Object.keys(config.endpointArgs ?? {}),
		...collectUrlParamNames(config.url ?? ''),
		...collectBodyKeys(config.body),
	];
};

export const matchNodesByProperty = (nodes: Node<WorkflowNodeData>[], term: string): Node<WorkflowNodeData>[] => {
	const needle = term.trim().toLowerCase();
	if (!needle) return [];
	return nodes.filter((node) => {
		if (!isMethodNode(node)) return false;
		return collectPropertyNames(node).some((name) => name.toLowerCase().includes(needle));
	});
};
