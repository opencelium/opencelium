import type { WorkflowNodeType } from '../types/workflow.types';

export function getNodeType(kind: string): WorkflowNodeType {
  if (kind === 'connector') return 'connector';
  if (kind === 'system') return 'system';
  if (kind === 'loop') return 'loop';
  return 'if';
}

export function getDefaultSourceHandle(
  nodeType: WorkflowNodeType,
  direction: 'right' | 'bottom',
): string | undefined {
  if (direction === 'bottom' && (nodeType === 'connector' || nodeType === 'system')) {
    return 'bottom';
  }
  if (nodeType === 'if') return direction === 'bottom' ? 'true' : 'false';
  if (nodeType === 'loop') return direction === 'bottom' ? 'bottom' : 'right';
  return undefined;
}

export function getDefaultTargetHandle(direction: 'right' | 'bottom'): string {
  return direction === 'bottom' ? 'top' : 'left';
}

export function getBottomSourceHandle(nodeType: WorkflowNodeType): string | undefined {
  if (nodeType === 'if') return 'true';
  if (nodeType === 'loop') return 'bottom';
  return undefined;
}

export function getRightSourceHandle(nodeType: WorkflowNodeType): string | undefined {
  if (nodeType === 'if') return 'false';
  if (nodeType === 'loop') return 'right';
  return undefined;
}
