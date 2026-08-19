import { createShortId } from '@shared/lib/createId';
import type { CommentWorkflowNode, WorkflowNodeModel } from '../types/workflow.types';
import { COMMENT_NODE_SIZE } from './graph.constants';

const NODE_BOX_SIZE = 96;
const SOURCE_GAP = 48;
const COLLISION_STEP = 40;
const MAX_COLLISION_STEPS = 12;

const getBox = (node: WorkflowNodeModel) => ({
  x: node.position.x,
  y: node.position.y,
  width: node.width ?? node.measured?.width ?? NODE_BOX_SIZE,
  height: node.height ?? node.measured?.height ?? NODE_BOX_SIZE,
});

const overlaps = (
  position: { x: number; y: number },
  node: WorkflowNodeModel,
) => {
  const box = getBox(node);
  return position.x < box.x + box.width
    && position.x + COMMENT_NODE_SIZE.width > box.x
    && position.y < box.y + box.height
    && position.y + COMMENT_NODE_SIZE.height > box.y;
};

/** Comments are not part of the executed graph, so they are never wired to an
 * edge and never laid out by the auto-layout — the position is the user's from
 * the moment it is created. It starts above the node whose "+" opened the
 * sidebar, stepping further up while that spot is taken. */
export const createCommentNode = (
  nodes: WorkflowNodeModel[],
  sourceNodeId: string,
): CommentWorkflowNode => {
  const source = nodes.find((node) => node.id === sourceNodeId);
  const anchor = source?.position ?? { x: 120, y: 220 };
  const position = {
    x: anchor.x - (COMMENT_NODE_SIZE.width - NODE_BOX_SIZE) / 2,
    y: anchor.y - COMMENT_NODE_SIZE.height - SOURCE_GAP,
  };
  for (let step = 0; step < MAX_COLLISION_STEPS; step += 1) {
    if (!nodes.some((node) => overlaps(position, node))) break;
    position.y -= COLLISION_STEP;
  }

  return {
    id: createShortId('comment'),
    type: 'comment',
    position,
    width: COMMENT_NODE_SIZE.width,
    height: COMMENT_NODE_SIZE.height,
    data: { title: '', kind: 'comment', comment: { text: '' } },
  };
};
