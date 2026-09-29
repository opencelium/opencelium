import type { BindingLensSummary, LensBinding, LensBindingGraph } from './bindingLens.types';

/** The method a binding's arc can hang off: the one actually read, or — for a
 *  reference naming a method it cannot read — that method, so the break shows up
 *  where it was meant to happen. */
export const bindingAnchorNodeId = (binding: LensBinding) =>
	binding.provider.nodeId ?? binding.unreadableProviderNodeId;

export const buildLensSummary = (graph: LensBindingGraph): BindingLensSummary => {
	const summary: BindingLensSummary = {
		total: graph.bindings.length,
		direct: 0,
		script: 0,
		invalid: 0,
		notShown: graph.skipped.malformed + graph.skipped.outsideScope + graph.skipped.unanchored,
	};
	graph.bindings.forEach((binding) => {
		if (binding.isScript) summary.script += 1;
		else summary.direct += 1;
		if (binding.invalidReason) summary.invalid += 1;
		if (!bindingAnchorNodeId(binding) || !binding.consumer.nodeId) summary.notShown += 1;
	});
	return summary;
};
