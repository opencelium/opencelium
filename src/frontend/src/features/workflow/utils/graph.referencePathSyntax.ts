import type { JSONPathEnvironment } from 'json-p3';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { resolveMethodIdentities } from '../components/request-editor/legacyConnectionBuilder';
import { findMethodByColor } from '../components/request-editor/body-editor/requestReferenceOptions';
import { checkReferencePathSyntax } from '../components/request-editor/body-editor/referencePathSyntax';
import { PayloadFormat } from '../types/connection';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceOccurrences } from './graph.referenceLocations';
import { normalizeReferenceColor } from './graph.referenceColors';

// An operator's subtitle is its condition expression unless the user renamed
// the step, so an unnamed one is shown by its kind instead.
export type InvalidReferenceStep =
	| { kind: 'named'; name: string }
	| { kind: 'operator'; operator: 'if' | 'loop' };

export type InvalidReferencePath = {
	nodeId: string;
	step: InvalidReferenceStep;
	/** The method the reference reads; null when no method on the canvas has its colour. */
	sourceName: string | null;
	direction: 'request' | 'response';
	path: string;
};

const describeStep = (node: WorkflowNodeModel | undefined, methodName: string | undefined): InvalidReferenceStep => {
	if (node?.type === 'if' || node?.type === 'loop') {
		return node.data.labelEdited && node.data.subtitle
			? { kind: 'named', name: String(node.data.subtitle) }
			: { kind: 'operator', operator: node.type };
	}
	return { kind: 'named', name: methodName ?? String(node?.data.title ?? node?.id ?? '') };
};

/**
 * Body references on the graph whose path would not compile as JsonPath.
 * json-p3 implements RFC 9535 while the backend runs Jayway, so this is an
 * approximation — callers warn instead of refusing.
 */
export const findInvalidReferencePaths = (
	environment: JSONPathEnvironment,
	nodes: WorkflowNodeModel[],
	fieldBindings: unknown[] | undefined,
): InvalidReferencePath[] => {
	const methods = buildLegacyConnection(nodes).fromConnector.method;
	const identities = resolveMethodIdentities(nodes);
	const nameById = new Map(identities.map((method) => [method.id, method.name]));
	const nameByColor = new Map(identities.map((method) => [normalizeReferenceColor(method.color), method.name]));
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const seen = new Set<string>();

	return collectReferenceOccurrences(nodes, fieldBindings).flatMap(({ parsed, consumerNodeId }) => {
		if (parsed.messageProperty !== 'body' || !parsed.path) return [];
		const method = findMethodByColor(methods, parsed.color);
		const body = parsed.direction === 'response' ? method?.response?.success?.body : method?.request?.body;
		if (body?.format === PayloadFormat.Xml) return [];
		if (checkReferencePathSyntax(environment, parsed.path).status === 'valid') return [];

		const key = `${consumerNodeId}:${parsed.color}:${parsed.direction}:${parsed.path}`;
		if (seen.has(key)) return [];
		seen.add(key);
		return [{
			nodeId: consumerNodeId,
			step: describeStep(nodeById.get(consumerNodeId), nameById.get(consumerNodeId)),
			sourceName: nameByColor.get(normalizeReferenceColor(parsed.color)) ?? null,
			direction: parsed.direction,
			path: parsed.path,
		}];
	});
};
