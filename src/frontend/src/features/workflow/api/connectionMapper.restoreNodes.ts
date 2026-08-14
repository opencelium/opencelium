import { initialNodes } from '../data/initialGraph';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { findEntryForSavedNode, mergeSavedNodeData } from './connectionMapper.savedNodeMatching';
import type { IndexedWorkflowEntry, SavedUiNode } from './connectionMapper.types';

export const restoreNodesFromUi = (
	entries: IndexedWorkflowEntry[],
	savedUiNodes: SavedUiNode[],
) => {
	const usedEntryIds = new Set<string>();
	const restoredNodes = savedUiNodes.map((savedNode) => {
		if (savedNode.type === 'start') {
			return {
				...initialNodes[0],
				id: savedNode.id,
				position: savedNode.position,
				data: mergeSavedNodeData(initialNodes[0].data, savedNode.data),
				draggable: savedNode.draggable ?? initialNodes[0].draggable,
				deletable: savedNode.deletable ?? initialNodes[0].deletable,
			};
		}
		const entry = findEntryForSavedNode(savedNode, entries, usedEntryIds);
		if (!entry) {
			return {
				id: savedNode.id,
				type: savedNode.type ?? 'connector',
				position: savedNode.position,
				data: savedNode.data ?? { title: '', kind: savedNode.type ?? 'connector' },
				draggable: savedNode.draggable,
				deletable: savedNode.deletable,
			} as WorkflowNodeModel;
		}
		usedEntryIds.add(entry.node.id);
		return {
			...entry.node,
			id: savedNode.id,
			position: savedNode.position,
			data: {
				...mergeSavedNodeData(entry.node.data, savedNode.data),
				kind: entry.node.data.kind,
				...(entry.node.type === 'system' ? { connector: undefined } : {}),
			},
			draggable: savedNode.draggable ?? entry.node.draggable,
			deletable: savedNode.deletable ?? entry.node.deletable,
		};
	}).filter(Boolean) as WorkflowNodeModel[];

	return {
		nodes: restoredNodes.some((node) => node.type === 'start')
			? restoredNodes : [initialNodes[0], ...restoredNodes],
		usedEntryIds,
	};
};
