import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { getWorkflowSubtree } from '../utils/graph.subtreeClone';
import { normalizeReferenceColor } from '../utils/graph.referenceColors';
import { collectReferenceOccurrences } from '../utils/graph.referenceLocations';

export const WORKFLOW_CLIPBOARD_KEY = 'opencelium.workflowClipboard.v1';
export type WorkflowClipboard = {
	version: 1;
	sourceWorkflowId: string;
	rootIds: string[];
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: unknown[];
	// Steps outside the copy are not carried over, so the paste check dialog
	// would otherwise only know them by their reference color.
	externalTitles?: Record<string, string>;
};

const collectExternalTitles = (selected: WorkflowNodeModel[], allNodes: WorkflowNodeModel[],
	bindings: unknown[]) => {
	const selectedColors = new Set(selected.map((node) => normalizeReferenceColor(node.data.color)));
	const titles: Record<string, string> = {};
	collectReferenceOccurrences(selected, bindings).forEach(({ parsed }) => {
		const color = normalizeReferenceColor(parsed.color);
		if (!color || selectedColors.has(color) || titles[color]) return;
		const source = allNodes.find((node) => normalizeReferenceColor(node.data.color) === color);
		const name = source?.data.subtitle || source?.data.title;
		if (name) titles[color] = name;
	});
	return titles;
};

export function createWorkflowClipboard(sourceWorkflowId: string, rootIds: string[],
	nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], fieldBindings: unknown[] = []): WorkflowClipboard {
	const ids = new Set(rootIds.flatMap((id) => getWorkflowSubtree(id, nodes, edges).nodes.map((node) => node.id)));
	const selected = nodes.filter((node) => ids.has(node.id) ||
		(node.type === 'comment' && ids.has(node.data.comment?.anchorNodeId ?? '')));
	const colors = new Set(selected.map((node) => normalizeReferenceColor(node.data.color)));
	const bindings = fieldBindings.filter((binding) => {
		const targets = (binding as { to?: { color?: string }[] })?.to;
		return targets?.some((target) => colors.has(normalizeReferenceColor(target.color)));
	});
	const snapshot: WorkflowClipboard = {
		version: 1,
		sourceWorkflowId,
		rootIds,
		nodes: selected,
		edges: edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
		fieldBindings: bindings,
		externalTitles: collectExternalTitles(selected, nodes, bindings),
	};
	return JSON.parse(JSON.stringify(snapshot));
}

const isTitleMap = (value: unknown): value is Record<string, string> =>
	typeof value === 'object' && value !== null && !Array.isArray(value) &&
	Object.values(value).every((title) => typeof title === 'string');

export function parseWorkflowClipboard(raw: string | null): WorkflowClipboard | null {
	if (!raw) return null;
	try {
		const value = JSON.parse(raw);
		if (value?.version !== 1 || typeof value.sourceWorkflowId !== 'string' ||
			!Array.isArray(value.rootIds) || !value.rootIds.every((id: unknown) => typeof id === 'string') ||
			!Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.fieldBindings)) return null;
		if (value.externalTitles !== undefined && !isTitleMap(value.externalTitles)) return null;
		if (!value.nodes.every((node: WorkflowNodeModel) => typeof node?.id === 'string' &&
			node.data && node.position && typeof node.type === 'string')) return null;
		const ids = new Set(value.nodes.map((node: WorkflowNodeModel) => node.id));
		if (!value.rootIds.every((id: string) => ids.has(id)) ||
			!value.edges.every((edge: WorkflowEdgeModel) => ids.has(edge?.source) && ids.has(edge?.target))) return null;
		return value;
	} catch {
		return null;
	}
}
