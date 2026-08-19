import type { CommentWorkflowNode, WorkflowNodeModel } from '../types/workflow.types';
import { COMMENT_NODE_SIZE } from '../utils/graph.constants';
import type { SavedUiNode } from './connectionMapper.types';

const isSavedCommentNode = (saved: SavedUiNode) => saved.type === 'comment';

const toCommentNode = (saved: SavedUiNode): CommentWorkflowNode => ({
	id: saved.id,
	type: 'comment',
	position: saved.position,
	width: saved.width ?? COMMENT_NODE_SIZE.width,
	height: saved.height ?? COMMENT_NODE_SIZE.height,
	data: {
		title: '',
		kind: 'comment',
		comment: { text: typeof saved.data?.comment?.text === 'string' ? saved.data.comment.text : '' },
	},
});

/**
 * Comments live only in the saved `ui.workflowNodes` blob — there is no matching
 * method/operator entry for them, so they cannot be rebuilt from
 * `fromConnector` like every other node. This normalizes the ones the generic
 * restore path already produced and adds back any that path skipped, which is
 * what makes a workflow whose graph is *only* comments (no method or operator
 * yet, so `restoreNodesFromUi` never runs) survive a reload.
 */
export const withRestoredCommentNodes = (
	nodes: WorkflowNodeModel[],
	savedUiNodes: SavedUiNode[],
): WorkflowNodeModel[] => {
	const savedComments = savedUiNodes.filter(isSavedCommentNode);
	if (savedComments.length === 0) return nodes;
	const savedById = new Map(savedComments.map((saved) => [saved.id, saved]));
	const presentIds = new Set(nodes.map((node) => node.id));
	return [
		...nodes.map((node) => {
			const saved = savedById.get(node.id);
			return saved ? toCommentNode(saved) : node;
		}),
		...savedComments
			.filter((saved) => !presentIds.has(saved.id))
			.map(toCommentNode),
	];
};
