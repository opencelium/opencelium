import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { isUnknownReferencePath } from '../components/request-editor/body-editor/requestReferenceOptions';
import { ITERATOR_NAMES } from '../components/request-editor/body-editor/requestReferenceIterators';
import type { LensBindingGraph } from '../lens/bindingLens.types';
import type { WorkflowNodeModel } from '../types/workflow.types';

/**
 * Per consumer node, how many of its references read a response-body field the
 * provider's declared response does not have — the warning the reference pickers
 * show, but for the whole graph at once. Every iterator name is accepted as a
 * for-in key regardless of loop nesting: a missed warning is cheaper than a false
 * one on a step the user has no reason to open.
 */
export const countUnknownReferencePaths = (nodes: WorkflowNodeModel[],
	bindingGraph: LensBindingGraph): Map<string, number> => {
	const methodsById = new Map(buildLegacyConnection(nodes).fromConnector.method
		.map((method) => [method.id, method]));
	const counts = new Map<string, number>();
	bindingGraph.bindings.forEach(({ consumer, provider, invalidReason }) => {
		// A binding that is already broken reports that instead; a path into a
		// method that is not there is not a path worth checking.
		if (invalidReason || !consumer.nodeId || !provider.nodeId || !provider.field) return;
		if (provider.direction !== 'response' || provider.messageProperty !== 'body') return;
		const method = methodsById.get(provider.nodeId);
		if (!isUnknownReferencePath(method, 'body', provider.field, ITERATOR_NAMES)) return;
		counts.set(consumer.nodeId, (counts.get(consumer.nodeId) ?? 0) + 1);
	});
	return counts;
};
