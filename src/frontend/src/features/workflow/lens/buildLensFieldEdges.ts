import type { LensBinding, LensEdgeData, LensEdgeModel } from './bindingLens.types';
import { bindingAnchorNodeId } from './buildLensSummary';
import { lensCardId, lensReferenceEdgeId, lensRowHandleId } from './lensIds';

// Once an endpoint is expanded the pair's arcs split apart, each landing on the
// field row it actually binds. The collapsed end keeps the node's own handles, so
// a half-expanded pair still reads as one continuous arc.
export const buildLensFieldEdges = (
	bindings: LensBinding[],
	expandedNodeIds: Set<string>,
	selectedKey: string | null,
	onSelectBinding: (bindingKey: string) => void,
): LensEdgeModel[] => bindings.flatMap((binding) => {
	const sourceNodeId = bindingAnchorNodeId(binding);
	const targetNodeId = binding.consumer.nodeId;
	if (!sourceNodeId || !targetNodeId) return [];

	const isSourceExpanded = expandedNodeIds.has(sourceNodeId);
	const isTargetExpanded = expandedNodeIds.has(targetNodeId);
	const isBroken = !!binding.invalidReason;
	const data: LensEdgeData = {
		variant: 'reference',
		color: binding.provider.color,
		providerLabel: binding.provider.label,
		consumerLabel: binding.consumer.label,
		count: 1,
		invalidCount: isBroken ? 1 : 0,
		hasScript: binding.isScript,
		bindingKeys: [binding.key],
		sourcePath: binding.provider.path,
		targetPath: binding.consumer.path,
		isSelected: binding.key === selectedKey,
		activates: 'select',
		onActivate: () => onSelectBinding(binding.key),
	};

	return [{
		type: 'binding-lens-edge' as const,
		className: 'bindingLensEdge',
		selectable: false,
		focusable: false,
		deletable: false,
		zIndex: 1,
		id: lensReferenceEdgeId(binding.key),
		source: isSourceExpanded ? lensCardId(sourceNodeId) : sourceNodeId,
		sourceHandle: isSourceExpanded
			? lensRowHandleId('source', binding.provider.path)
			: 'bottom',
		target: isTargetExpanded ? lensCardId(targetNodeId) : targetNodeId,
		targetHandle: isTargetExpanded
			? lensRowHandleId('target', binding.consumer.path)
			: 'left',
		data,
	} satisfies LensEdgeModel];
});
