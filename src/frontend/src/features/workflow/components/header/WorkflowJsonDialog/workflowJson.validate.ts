import { workflowJsonSchema, type WorkflowJsonPayload } from './workflowJson.schema';
import { mapConnectionToWorkflowState } from '../../../api/connectionMapper';
import { findInvalidWorkflowReferences } from '../../../utils/graph.invalidReferences';
import { findBrokenEnhancementScripts } from '../../../utils/graph.brokenScriptValidation';
import { evaluateJointTargets } from '../../../utils/jumpValidator';

export type WorkflowJsonError = { key: string; path?: string; reason?: string };
export type WorkflowJsonValidation =
	| { success: true; data: WorkflowJsonPayload }
	| { success: false; errors: WorkflowJsonError[] };

const INDEX_RE = /^\d+(?:_\d+)*$/;

export function validateWorkflowJson(value: unknown): WorkflowJsonValidation {
	const parsed = workflowJsonSchema.safeParse(value);
	if (!parsed.success) {
		return { success: false, errors: parsed.error.issues.slice(0, 5).map((issue) => ({
			key: 'json.errors.schema',
			path: issue.path.join('.'),
			reason: issue.message,
		})) };
	}

	const { methods, operators } = parsed.data.fromConnector;
	const entries = [...methods, ...operators];
	const indexes = new Set<string>();
	const operatorIndexes = new Set(operators.map((operator) => operator.index));
	for (const [position, entry] of entries.entries()) {
		const isOperator = 'type' in entry;
		const arrayPosition = isOperator ? position - methods.length : position;
		const path = `fromConnector.${isOperator ? 'operators' : 'methods'}[${arrayPosition}].index`;
		if (!INDEX_RE.test(entry.index)) return { success: false,
			errors: [{ key: 'json.errors.indexShape', path }] };
		if (indexes.has(entry.index)) return { success: false,
			errors: [{ key: 'json.errors.duplicateIndex', path }] };
		indexes.add(entry.index);
		const separator = entry.index.lastIndexOf('_');
		if (separator > 0 && !operatorIndexes.has(entry.index.slice(0, separator))) {
			return { success: false, errors: [{ key: 'json.errors.missingParent', path }] };
		}
	}

	const nodes = parsed.data.ui.workflowNodes;
	const nodeIds = new Set<string>();
	for (const node of nodes) {
		if (nodeIds.has(node.id)) return { success: false,
			errors: [{ key: 'json.errors.duplicateNode', path: `ui.workflowNodes.${node.id}` }] };
		nodeIds.add(node.id);
	}
	const startCount = nodes.filter((node) => node.type === 'start').length;
	if (startCount !== 1) return { success: false,
		errors: [{ key: 'json.errors.startCount', reason: String(startCount) }] };
	for (const edge of parsed.data.ui.workflowEdges) {
		if (!nodeIds.has(edge.source)) return { success: false,
			errors: [{ key: 'json.errors.edgeSource', path: `ui.workflowEdges.${edge.id}.source` }] };
		if (!nodeIds.has(edge.target)) return { success: false,
			errors: [{ key: 'json.errors.edgeTarget', path: `ui.workflowEdges.${edge.id}.target` }] };
	}
	try {
		const state = mapConnectionToWorkflowState(parsed.data);
		const nonStartNodes = state.nodes.filter((node) => node.type !== 'start');
		if (methods.length > 0 && nonStartNodes.length === 0) return { success: false,
			errors: [{ key: 'json.errors.mapperDroppedMethods' }] };
		const invalidReferences = findInvalidWorkflowReferences(
			state.nodes, state.edges, undefined, state.fieldBindings,
		);
		if (invalidReferences.length) {
			const broken = invalidReferences[0];
			const node = state.nodes.find((item) => item.id === broken.consumerNodeId);
			return { success: false, errors: [{ key: 'json.errors.brokenReference',
				path: node?.data.subtitle ?? node?.data.title ?? broken.consumerNodeId,
				reason: broken.sourceColor }] };
		}
		const brokenScripts = findBrokenEnhancementScripts(state.nodes, state.fieldBindings);
		if (brokenScripts.length) {
			const broken = brokenScripts[0];
			return { success: false, errors: [{ key: 'json.errors.brokenScript',
				path: broken.label ?? broken.nodeId ?? broken.enhanceId }] };
		}
		for (const node of state.nodes) {
			if (!node.data.jump) continue;
			const verdict = evaluateJointTargets(node.id, state.nodes, state.edges,
				state.fieldBindings).get(node.data.jump);
			if (!verdict?.valid) return { success: false, errors: [{
				key: `json.errors.illegalJoint.${verdict?.reason ?? 'missingTarget'}`,
				path: node.data.subtitle ?? node.data.title,
			}] };
		}
	} catch (error: unknown) {
		return { success: false, errors: [{ key: 'json.errors.mapperFailed',
			reason: error instanceof Error ? error.message : String(error) }] };
	}
	return { success: true, data: parsed.data };
}
