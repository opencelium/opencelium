import type { DetailedMethodLog, LiveLogNode, LiveLogTree, LogType } from '@features/logs';
import { serializeReferenceString } from '@features/workflow/api/connectionPayload.references';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import type { RunFailureRequest } from '../model/aiGateway.types';

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

const bodyText = (body: unknown) => (typeof body === 'string' ? body : body === undefined || body === null ? '' : JSON.stringify(body, null, 2));

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
	const segment = details?.segment;
	const request: RunFailureRequest = {
		language,
		workflowTitle,
		failure: {
			kind,
			message: failed.message || details?.error?.message || '',
			stepName: node?.data.title ?? details?.properties.label ?? details?.properties.name ?? '',
			system: node?.data.connector?.invokerName ?? '',
			operation: node ? operationOf(node) : details?.properties.name ?? '',
			context: failed.indexPath ? enclosingOperators(tree, failed.indexPath) : [],
			...(segment ? {
				request: { method: segment.request.http_method, url: segment.request.url, body: segment.request.payload },
				response: { status: segment.response.status, body: segment.response.payload },
			} : {}),
		},
		...(kind === 'method' && config ? { step: { url: serializeReferenceString(config.url, config.endpointArgs), body: bodyText(config.body) } } : {}),
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
