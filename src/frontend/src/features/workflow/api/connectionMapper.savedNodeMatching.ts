import type { WorkflowNodeModel } from '../types/workflow.types';
import type { IndexedWorkflowEntry, SavedUiNode } from './connectionMapper.types';

export const mergeSavedNodeData = (
	builtData: WorkflowNodeModel['data'],
	savedData?: WorkflowNodeModel['data'],
): WorkflowNodeModel['data'] => {
	if (!savedData) return builtData;
	const {
		title, subtitle, kind, connector, methodConfig, conditionConfig, comment,
		isLeaf, rightLeaf, bottomLeaf, highlighted,
		suppressHoverAddControls, lockVisibleAddControls,
	} = savedData;
	return {
		...builtData,
		...(title !== undefined ? { title } : {}),
		...(subtitle !== undefined ? { subtitle } : {}),
		...(kind !== undefined ? { kind } : {}),
		...(connector !== undefined ? { connector } : {}),
		...(methodConfig !== undefined ? { methodConfig } : {}),
		...(conditionConfig !== undefined ? { conditionConfig } : {}),
		...(comment !== undefined ? { comment } : {}),
		...(isLeaf !== undefined ? { isLeaf } : {}),
		...(rightLeaf !== undefined ? { rightLeaf } : {}),
		...(bottomLeaf !== undefined ? { bottomLeaf } : {}),
		...(highlighted !== undefined ? { highlighted } : {}),
		...(suppressHoverAddControls !== undefined ? { suppressHoverAddControls } : {}),
		...(lockVisibleAddControls !== undefined ? { lockVisibleAddControls } : {}),
	};
};

const normalizeMatchValue = (value: unknown) => String(value ?? '').trim().toLowerCase();
const typeMatches = (
	savedType: WorkflowNodeModel['type'] | undefined,
	entryType: WorkflowNodeModel['type'],
) => !savedType || savedType === entryType
	|| (savedType === 'connector' && entryType === 'system');

export const findSavedNode = (
	node: WorkflowNodeModel,
	entry: IndexedWorkflowEntry | undefined,
	savedUiNodes: SavedUiNode[],
	usedSavedNodeIds: Set<string>,
) => {
	const source = entry?.source;
	const stages = [
		[[entry?.index, source?.index], (saved: SavedUiNode) => [saved.index]],
		[[node.id, source?.id, source?.nodeId],
			(saved: SavedUiNode) => [saved.id, saved.nodeId]],
	] as const;
	for (const [sourceValues, getSavedValues] of stages) {
		const candidates = sourceValues.map(normalizeMatchValue).filter(Boolean);
		if (!candidates.length) continue;
		const match = savedUiNodes.find((saved) => {
			if (usedSavedNodeIds.has(saved.id)) return false;
			if (node.type !== 'start' && !typeMatches(saved.type, node.type)) return false;
			const savedCandidates = getSavedValues(saved).map(normalizeMatchValue).filter(Boolean);
			return candidates.some((candidate) => savedCandidates.includes(candidate));
		});
		if (match) return match;
	}
};

export const findEntryForSavedNode = (
	savedNode: SavedUiNode,
	entries: IndexedWorkflowEntry[],
	usedEntryIds: Set<string>,
) => {
	const stages = [
		[[savedNode.index], (entry: IndexedWorkflowEntry) => [entry.index, entry.source?.index]],
		[[savedNode.id, savedNode.nodeId],
			(entry: IndexedWorkflowEntry) => [entry.node.id, entry.source?.id, entry.source?.nodeId]],
	] as const;
	for (const [savedValues, getEntryValues] of stages) {
		const candidates = savedValues.map(normalizeMatchValue).filter(Boolean);
		if (!candidates.length) continue;
		const match = entries.find((entry) => {
			if (usedEntryIds.has(entry.node.id) || !typeMatches(savedNode.type, entry.node.type)) {
				return false;
			}
			const entryCandidates = getEntryValues(entry).map(normalizeMatchValue).filter(Boolean);
			return candidates.some((candidate) => entryCandidates.includes(candidate));
		});
		if (match) return match;
	}
};
