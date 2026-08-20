import type { WorkflowCreateKind, WorkflowNodeType } from '../types/workflow.types';

export function getNodeType(kind: WorkflowCreateKind): WorkflowNodeType {
  switch (kind) {
    case 'connector': return 'connector';
    case 'system': return 'system';
    case 'trigger-connection': return 'trigger-connection';
    case 'loop': return 'loop';
    case 'if': return 'if';
    case 'comment': return 'comment';
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function getDefaultSourceHandle(
  nodeType: WorkflowNodeType,
  direction: 'right' | 'bottom',
): string | undefined {
  if (direction === 'bottom' && (nodeType === 'connector' || nodeType === 'system' || nodeType === 'trigger-connection')) {
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
