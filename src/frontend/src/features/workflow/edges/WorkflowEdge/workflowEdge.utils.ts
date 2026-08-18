import { getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';

const TARGET_GAP = 3;

export function getWorkflowEdgePath(props: EdgeProps<WorkflowEdgeModel>, isIfBranch: boolean) {
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
    let adjustedTargetX = targetX;
    let adjustedTargetY = targetY;
    if (targetPosition === 'left') adjustedTargetX += TARGET_GAP;
    if (targetPosition === 'right') adjustedTargetX -= TARGET_GAP;
    if (targetPosition === 'top') adjustedTargetY += TARGET_GAP;
    if (targetPosition === 'bottom') adjustedTargetY -= TARGET_GAP;

    const pathArgs = {
        sourceX, sourceY, targetX: adjustedTargetX, targetY: adjustedTargetY,
        sourcePosition, targetPosition,
    };
    return isIfBranch
        ? getSmoothStepPath({ ...pathArgs, borderRadius: 18, offset: 18 })[0]
        : getBezierPath(pathArgs)[0];
}

export function getWorkflowEdgeStyle(
    data: WorkflowEdgeModel['data'],
    isHighlighted: boolean,
): CSSProperties | undefined {
    if (data?.dropInvalid) {
        return { stroke: 'var(--color-status-error-fg)', color: 'var(--color-status-error-fg)' };
    }
    if (data?.dragGhost || data?.dropPlaceholder) {
        return {
            opacity: data.dragGhost ? 0.45 : 0.55,
            stroke: 'var(--color-action-primary)',
            color: 'var(--color-action-primary)',
            strokeDasharray: data.dropPlaceholder ? '6 6' : undefined,
        };
    }
    return isHighlighted
        ? { stroke: 'var(--color-action-primary)', color: 'var(--color-action-primary)' }
        : undefined;
}
