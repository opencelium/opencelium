import type { DetailedMethodLog, LiveLogNode, LiveLogTree, LogType } from '@features/logs';
import { serializeHeaderReferences, serializeReferenceString } from '@features/workflow/api/connectionPayload.references';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import type { RunFailureRequest, RunHeader } from '../model/aiGateway.types';

/** The failing element as the log tree knows it: where it is, what kind it is and the error it carries. */
export type FailedElement = { indexPath: string; loopIndex: string; type: LogType; message: string };

/** The method node a fix would change, with its config as it was when the failure was collected. */
export type FixTarget = { nodeId: string; methodConfig: WorkflowMethodConfig };

export type CollectedFailure = { request: RunFailureRequest; target: FixTarget | null };

const KIND: Partial<Record<LogType, RunFailureRequest['failure']['kind']>> = { OPERATION: 'method', LOOP: 'loop', IF: 'if' };

const isMethodNode = (node: WorkflowNodeModel) => Boolean(node.data.methodConfig);

/**
 * The run's first error and where it happened. The error line's origin is where the message is attached; a run that
 * failed without one (an execution-level error) still names a node with an error, or nothing at all.
 */
export function findFailedElement(tree: LiveLogTree): FailedElement | null {
	const location = tree.errorLocations[0];
	const nodes = Object.values(tree.nodes);
	const atOrigin = location && nodes.find((node) => node.indexPath === location.indexPath && node.loopIndex === location.loopIndex);
	const withError = atOrigin?.error ? atOrigin : nodes.find((node) => node.error?.message);
	if (!location && !withError) return null;
	return {
		indexPath: location?.indexPath ?? withError?.indexPath ?? '',
		loopIndex: location?.loopIndex ?? withError?.loopIndex ?? '',
		type: atOrigin?.type ?? withError?.type ?? 'EXECUTION',
		message: atOrigin?.error?.message ?? withError?.error?.message ?? '',
	};
}

/** The loops and ifs around an index path ("1_2_0" sits in "1" and "1_2"), outermost first, as their expressions. */
export function enclosingOperators(tree: LiveLogTree, indexPath: string): string[] {
	const segments = indexPath.split('_');
	const byIndexPath = new Map<string, LiveLogNode>();
	for (const node of Object.values(tree.nodes)) if (!byIndexPath.has(node.indexPath)) byIndexPath.set(node.indexPath, node);
	return segments.slice(1).map((_, position) => byIndexPath.get(segments.slice(0, position + 1).join('_')))
		.flatMap((node) => {
			if (node?.type === 'LOOP') return [`for each ${node.properties.iterator ?? 'item'} of ${node.properties.expression ?? ''}`.trim()];
			if (node?.type === 'IF') return [`if ${node.properties.expression ?? ''}`.trim()];
			return [];
		});
}

export const bodyText = (body: unknown) => (typeof body === 'string' ? body : body === undefined || body === null ? '' : JSON.stringify(body, null, 2));

const canonicalJson = (text: string) => {
	try {
		return JSON.stringify(JSON.parse(text));
	} catch {
		return null;
	}
};

/** A JSON body laid out like the step's own body is shown; anything else as it came. */
export function prettyBody(text: string): string {
	try {
		return JSON.stringify(JSON.parse(text), null, 2);
	} catch {
		return text;
	}
}

/** Whether a proposed body says the same as the step's: the model reformats JSON it leaves unchanged. */
export function isSameBody(current: unknown, proposed: string): boolean {
	const text = bodyText(current);
	if (text.trim() === proposed.trim()) return true;
	const before = canonicalJson(text);
	return before !== null && before === canonicalJson(proposed);
}

/** The step's headers with their reference tokens written out, as the AI reads and answers them. */
export const stepHeaders = (config: WorkflowMethodConfig): RunHeader[] => Object.entries(config.headers ?? {})
	.map(([name, value]) => ({ name, value: String(serializeHeaderReferences(value, config.endpointArgs)) }));

const findHeader = (headers: RunHeader[], name: string) => headers.find((header) => header.name.toLowerCase() === name.toLowerCase());

/** The headers a fix changes or adds; `before` is null for a new one. */
export function changedHeaders(config: WorkflowMethodConfig, fixed: RunHeader[]): { name: string; before: string | null; after: string }[] {
	const current = stepHeaders(config);
	return fixed.flatMap((header) => {
		const before = findHeader(current, header.name)?.value ?? null;
		return before === header.value ? [] : [{ name: header.name, before, after: header.value }];
	});
}

/** The editor's headers with a fix applied: unchanged ones keep their tokens, changed ones take the new text. */
export function toEditorHeaders(config: WorkflowMethodConfig, fixed: RunHeader[]): Record<string, string> {
	const headers = { ...config.headers };
	for (const { name, after } of changedHeaders(config, fixed)) {
		const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === name.toLowerCase()) ?? name;
		headers[key] = after;
	}
	return headers;
}

const operationOf = (node: WorkflowNodeModel) => node.data.methodConfig?.name ?? node.data.subtitle ?? '';

type BuildArgs = {
	failed: FailedElement;
	details: DetailedMethodLog | null;
	tree: LiveLogTree;
	nodes: WorkflowNodeModel[];
	/** Graph node id → tree-path index, as `buildWorkflowIndexes` returns it; log index paths use the same index. */
	indexByNodeId: Map<string, string>;
	workflowTitle: string;
	language: RunFailureRequest['language'];
};

export function buildRunFailure({ failed, details, tree, nodes, indexByNodeId, workflowTitle, language }: BuildArgs): CollectedFailure {
	const node = nodes.find((candidate) => indexByNodeId.get(candidate.id) === failed.indexPath);
	const config = node?.data.methodConfig;
	const kind = KIND[failed.type] ?? 'execution';
	// A call that failed before it was sent is logged with an empty segment and nulls, despite the declared strings.
	const sent = details?.segment?.request;
	const received = details?.segment?.response;
	const request: RunFailureRequest = {
		language,
		workflowTitle,
		failure: {
			kind,
			message: failed.message || details?.error?.message || '',
			stepName: node?.data.title ?? details?.properties?.label ?? details?.properties?.name ?? '',
			system: node?.data.connector?.invokerName ?? '',
			operation: node ? operationOf(node) : details?.properties?.name ?? '',
			context: failed.indexPath ? enclosingOperators(tree, failed.indexPath) : [],
			...(sent ? { request: { method: sent.http_method ?? '', url: sent.url ?? '', body: sent.payload ?? undefined } } : {}),
			...(received ? { response: { status: received.status ?? '', body: received.payload ?? undefined } } : {}),
		},
		...(kind === 'method' && config ? { step: { url: serializeReferenceString(config.url, config.endpointArgs), body: bodyText(config.body), headers: stepHeaders(config) } } : {}),
		earlierSteps: nodes.filter((candidate) => isMethodNode(candidate) && candidate.id !== node?.id && candidate.data.color)
			.map((candidate) => ({
				color: candidate.data.color ?? '', name: candidate.data.title, operation: operationOf(candidate),
				system: candidate.data.connector?.invokerName ?? '',
			})),
	};
	return { request, target: kind === 'method' && node && config ? { nodeId: node.id, methodConfig: config } : null };
}

/**
 * The fixed body in the shape the editor keeps: a parsed object or array when the step's body is one, text otherwise.
 * Undefined when a JSON body came back as something that does not parse.
 */
export function toEditorBody(original: unknown, fixed: string): unknown {
	if (typeof original === 'string') return fixed;
	try {
		return JSON.parse(fixed) as unknown;
	} catch {
		return undefined;
	}
}
