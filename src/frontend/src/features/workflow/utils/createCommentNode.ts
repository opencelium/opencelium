import { createShortId } from '@shared/lib/createId';
import type { CommentWorkflowNode, WorkflowNodeModel } from '../types/workflow.types';
import { COMMENT_NODE_SIZE } from './graph.constants';
import { resolveCommentPosition, type NodePosition } from './commentAnchor';

const NODE_BOX_SIZE = 96;
const ANCHOR_GAP = 48;
const COLLISION_STEP = 40;
const MAX_COLLISION_STEPS = 12;

const getBox = (node: WorkflowNodeModel) => ({
  x: node.position.x,
  y: node.position.y,
  width: node.width ?? node.measured?.width ?? NODE_BOX_SIZE,
  height: node.height ?? node.measured?.height ?? NODE_BOX_SIZE,
});

const overlaps = (position: NodePosition, node: WorkflowNodeModel) => {
  const box = getBox(node);
  return position.x < box.x + box.width
    && position.x + COMMENT_NODE_SIZE.width > box.x
    && position.y < box.y + box.height
    && position.y + COMMENT_NODE_SIZE.height > box.y;
};

/** Creates the note for `anchorNodeId`: it starts above that node, stepping
 * further up while the spot is taken, and from then on keeps that offset (the
 * note follows its anchor — see WorkflowCommentData.offset). Returns undefined
 * if the anchor is gone, since a note without one cannot exist. */
export const createCommentNode = (
  nodes: WorkflowNodeModel[],
  anchorNodeId: string,
): CommentWorkflowNode | undefined => {
  const anchor = nodes.find((node) => node.id === anchorNodeId);
  if (!anchor) return undefined;

  const offset = {
    x: -(COMMENT_NODE_SIZE.width - NODE_BOX_SIZE) / 2,
    y: -(COMMENT_NODE_SIZE.height + ANCHOR_GAP),
  };
  for (let step = 0; step < MAX_COLLISION_STEPS; step += 1) {
    const candidate = resolveCommentPosition({ text: '', anchorNodeId, offset }, anchor.position);
    if (!nodes.some((node) => overlaps(candidate, node))) break;
    offset.y -= COLLISION_STEP;
  }

  return {
    id: createShortId('comment'),
    type: 'comment',
    position: resolveCommentPosition({ text: '', anchorNodeId, offset }, anchor.position),
    width: COMMENT_NODE_SIZE.width,
    height: COMMENT_NODE_SIZE.height,
    data: { title: '', kind: 'comment', comment: { text: '', anchorNodeId, offset } },
  };
};
