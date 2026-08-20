import type { WorkflowCommentData, WorkflowNodeModel } from '../types/workflow.types';

export type NodePosition = { x: number; y: number };

export const getNodeComment = (node: WorkflowNodeModel): WorkflowCommentData | undefined =>
  node.type === 'comment' ? node.data.comment : undefined;

export const findAnchoredComment = (nodes: WorkflowNodeModel[], anchorNodeId: string) =>
  nodes.find((node) => getNodeComment(node)?.anchorNodeId === anchorNodeId);

/** A note's absolute position is always its anchor's position plus the stored
 * offset — the offset is the source of truth, `node.position` only a cache of the
 * last derived value (see WorkflowCommentData.offset). */
export const resolveCommentPosition = (
  comment: WorkflowCommentData,
  anchorPosition: NodePosition,
): NodePosition => ({
  x: anchorPosition.x + comment.offset.x,
  y: anchorPosition.y + comment.offset.y,
});

/** The inverse, for when the user drags the note itself: whatever absolute
 * position it was dropped at becomes a new offset from its anchor. */
export const withCommentOffsetFromPosition = (
  nodes: WorkflowNodeModel[],
  commentNodeId: string,
  position: NodePosition,
): WorkflowNodeModel[] => {
  const comment = getNodeComment(nodes.find((node) => node.id === commentNodeId) ?? {} as WorkflowNodeModel);
  const anchor = comment && nodes.find((node) => node.id === comment.anchorNodeId);
  if (!comment || !anchor) return nodes;
  const offset = { x: position.x - anchor.position.x, y: position.y - anchor.position.y };
  if (offset.x === comment.offset.x && offset.y === comment.offset.y) return nodes;
  return nodes.map((node) => node.id === commentNodeId
    ? { ...node, position, data: { ...node.data, comment: { ...comment, offset } } }
    : node);
};
