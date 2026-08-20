import type { LensBinding, LensCardData, LensCardRow, LensNodeModel } from './bindingLens.types';
import { bindingAnchorNodeId } from './buildLensSummary';
import { lensCardId } from './lensIds';

export const LENS_CARD_WIDTH = 240;
// node.position is the centre of the 62px circle (see .nodeBody in nodes.css),
// so the card is centred under it, clear of the node and of the arcs' dip.
const CARD_OFFSET_Y = 64;

type AnchorNode = { id: string; position: { x: number; y: number }; label: string; color: string };

const addRow = (rows: Map<string, LensCardRow>, row: LensCardRow) => {
	const key = `${row.role}:${row.path}`;
	const existing = rows.get(key);
	if (!existing) {
		rows.set(key, row);
		return;
	}
	// One field can be bound several times over (many sources into one target,
	// or one response field read by several methods): the row is the field, and
	// it carries every binding behind it.
	existing.bindingKeys.push(...row.bindingKeys);
	existing.hasScript = existing.hasScript || row.hasScript;
	existing.isBroken = existing.isBroken || row.isBroken;
	existing.isSelected = existing.isSelected || row.isSelected;
	if (existing.counterpartLabel !== row.counterpartLabel) existing.counterpartLabel = null;
};

export const buildLensCards = (
	bindings: LensBinding[],
	expandedNodeIds: Set<string>,
	anchorsById: Map<string, AnchorNode>,
	selectedKey: string | null,
	onCollapse: (nodeId: string) => void,
): LensNodeModel[] => {
	const rowsByNode = new Map<string, Map<string, LensCardRow>>();
	const rowsFor = (nodeId: string) => {
		const rows = rowsByNode.get(nodeId) ?? new Map<string, LensCardRow>();
		rowsByNode.set(nodeId, rows);
		return rows;
	};

	[...expandedNodeIds].filter((nodeId) => anchorsById.has(nodeId)).forEach((nodeId) => rowsFor(nodeId));

	bindings.forEach((binding) => {
		const isBroken = !!binding.invalidReason;
		const isSelected = binding.key === selectedKey;
		const sourceNodeId = bindingAnchorNodeId(binding);
		const targetNodeId = binding.consumer.nodeId;
		if (sourceNodeId && expandedNodeIds.has(sourceNodeId)) {
			addRow(rowsFor(sourceNodeId), {
				role: 'source', path: binding.provider.path,
				counterpartLabel: binding.consumer.label, color: binding.provider.color,
				hasScript: binding.isScript, isBroken, isSelected, bindingKeys: [binding.key],
			});
		}
		if (targetNodeId && expandedNodeIds.has(targetNodeId)) {
			addRow(rowsFor(targetNodeId), {
				role: 'target', path: binding.consumer.path,
				counterpartLabel: binding.provider.label, color: binding.provider.color,
				hasScript: binding.isScript, isBroken, isSelected, bindingKeys: [binding.key],
			});
		}
	});

	return [...rowsByNode.entries()].flatMap(([nodeId, rows]) => {
		const anchor = anchorsById.get(nodeId);
		if (!anchor) return [];
		const data: LensCardData = {
			anchorNodeId: nodeId,
			label: anchor.label,
			color: anchor.color,
			rows: [...rows.values()],
			onCollapse: () => onCollapse(nodeId),
		};
		return [{
			id: lensCardId(nodeId),
			type: 'binding-lens-card' as const,
			position: {
				x: anchor.position.x - LENS_CARD_WIDTH / 2,
				y: anchor.position.y + CARD_OFFSET_Y,
			},
			draggable: false,
			selectable: false,
			focusable: false,
			deletable: false,
			zIndex: 2,
			data,
		} satisfies LensNodeModel];
	});
};
