import type { JSONPathEnvironment } from 'json-p3';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { findMethodByColor } from '../components/request-editor/body-editor/requestReferenceOptions';
import { checkReferencePathSyntax } from '../components/request-editor/body-editor/referencePathSyntax';
import { PayloadFormat } from '../types/connection';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceOccurrences } from '../utils/graph.referenceLocations';

/**
 * Per step, how many distinct body references have a path that would not compile
 * as JsonPath. json-p3 implements RFC 9535 while the backend runs Jayway, so this
 * is an approximation — the problem is a warning, never a refusal.
 */
export const countInvalidReferencePaths = (
	environment: JSONPathEnvironment | null,
	nodes: WorkflowNodeModel[],
	fieldBindings: readonly unknown[] | undefined,
): Map<string, number> => {
	const counts = new Map<string, number>();
	if (!environment) return counts;
	const methods = buildLegacyConnection(nodes).fromConnector.method;
	const seen = new Set<string>();
	collectReferenceOccurrences(nodes, fieldBindings as unknown[] | undefined).forEach(({ parsed, consumerNodeId }) => {
		if (parsed.messageProperty !== 'body' || !parsed.path) return;
		const method = findMethodByColor(methods, parsed.color);
		const body = parsed.direction === 'response' ? method?.response?.success?.body : method?.request?.body;
		if (body?.format === PayloadFormat.Xml) return;
		const key = `${consumerNodeId}:${parsed.color}:${parsed.direction}:${parsed.path}`;
		if (seen.has(key) || checkReferencePathSyntax(environment, parsed.path).status === 'valid') return;
		seen.add(key);
		counts.set(consumerNodeId, (counts.get(consumerNodeId) ?? 0) + 1);
	});
	return counts;
};
