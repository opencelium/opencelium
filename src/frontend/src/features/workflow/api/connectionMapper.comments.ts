import type { CommentWorkflowNode, WorkflowNodeModel } from '../types/workflow.types';
import { resolveCommentPosition } from '../utils/commentAnchor';
import { COMMENT_NODE_SIZE } from '../utils/graph.constants';
import type { SavedUiNode } from './connectionMapper.types';

type SavedComment = { anchorNodeId: string; offset: { x: number; y: number } };

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** The saved blob is schema-less, so a comment only counts as one if it names the
 * node it belongs to and where it sits relative to it. */
const readSavedComment = (saved: SavedUiNode): SavedComment | undefined => {
	if (saved.type !== 'comment') return undefined;
	const comment = saved.data?.comment;
	const offset = comment?.offset;
	return comment && typeof comment.anchorNodeId === 'string' && comment.anchorNodeId
		&& isNumber(offset?.x) && isNumber(offset?.y)
		? { anchorNodeId: comment.anchorNodeId, offset: { x: offset.x, y: offset.y } }
		: undefined;
};

const toCommentNode = (
	saved: SavedUiNode,
	parsed: SavedComment,
	anchor: WorkflowNodeModel,
): CommentWorkflowNode => ({
	id: saved.id,
	type: 'comment',
	position: resolveCommentPosition({ text: '', ...parsed }, anchor.position),
	width: saved.width ?? COMMENT_NODE_SIZE.width,
	height: saved.height ?? COMMENT_NODE_SIZE.height,
	data: {
		title: '',
		kind: 'comment',
		comment: {
			text: typeof saved.data?.comment?.text === 'string' ? saved.data.comment.text : '',
			anchorNodeId: parsed.anchorNodeId,
			offset: parsed.offset,
			...(saved.data?.comment?.collapsed ? { collapsed: true } : {}),
		},
	},
});

/**
 * Comments live only in the saved `ui.workflowNodes` blob — there is no matching
 * method/operator entry for them, so they cannot be rebuilt from `fromConnector`
 * like every other node. This normalizes the ones the generic restore path
 * already produced and adds back any that path skipped, which is what makes a
 * workflow whose graph is *only* comments (no method or operator yet, so
 * `restoreNodesFromUi` never runs) survive a reload. A comment whose anchor node
 * is no longer in the graph is dropped — deleting a node deletes its note, so
 * such an entry is a leftover from an older save, not something to show.
 */
export const withRestoredCommentNodes = (
	nodes: WorkflowNodeModel[],
	savedUiNodes: SavedUiNode[],
): WorkflowNodeModel[] => {
	const savedComments = savedUiNodes
		.map((saved) => ({ saved, parsed: readSavedComment(saved) }))
		.filter((entry): entry is { saved: SavedUiNode; parsed: SavedComment } => !!entry.parsed);
	if (savedComments.length === 0) {
		return nodes.filter((node) => node.type !== 'comment');
	}
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const restoredById = new Map(savedComments
		.map(({ saved, parsed }) => {
			const anchor = nodeById.get(parsed.anchorNodeId);
			return anchor ? [saved.id, toCommentNode(saved, parsed, anchor)] as const : undefined;
		})
		.filter((entry): entry is readonly [string, CommentWorkflowNode] => !!entry));
	const presentIds = new Set(nodes.map((node) => node.id));

	return [
		...nodes.flatMap((node) => {
			if (node.type !== 'comment') return [node];
			const restored = restoredById.get(node.id);
			return restored ? [restored] : [];
		}),
		...[...restoredById.values()].filter((node) => !presentIds.has(node.id)),
	];
};
