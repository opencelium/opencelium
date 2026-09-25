import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';

const TARGET_GAP = 3;
// The travelling test-run dot deliberately overshoots the visible edge and
// continues into the target node's footprint, where the node body (nodes render
// above edges) covers it — the dot reads as entering the node and parking there.
const DOT_INTO_NODE = 30;

type Geometry = Pick<EdgeProps<WorkflowEdgeModel>,
	'sourceX' | 'sourceY' | 'targetX' | 'targetY' | 'sourcePosition' | 'targetPosition'>;

const shiftTarget = (props: Geometry, distance: number) => {
	const { targetX, targetY, targetPosition } = props;
	if (targetPosition === 'left') return { x: targetX + distance, y: targetY };
	if (targetPosition === 'right') return { x: targetX - distance, y: targetY };
	if (targetPosition === 'top') return { x: targetX, y: targetY + distance };
	if (targetPosition === 'bottom') return { x: targetX, y: targetY - distance };
	return { x: targetX, y: targetY };
};

// Every workflow edge is a bezier S-curve — chain edges, IF branches, loop
// bodies and joints alike — so no edge kind stands out by its shape and a joint
// is indistinguishable in form from the edge it runs alongside.
const buildPath = (props: Geometry, targetDistance: number) => {
	const { sourceX, sourceY, sourcePosition, targetPosition } = props;
	const target = shiftTarget(props, targetDistance);
	return getBezierPath({
		sourceX, sourceY, targetX: target.x, targetY: target.y,
		sourcePosition, targetPosition,
	});
};

export function getWorkflowEdgePath(props: Geometry) {
	return buildPath(props, TARGET_GAP)[0];
}

/** Midpoint of the rendered path — where an edge-hosted control is anchored. */
export function getWorkflowEdgeLabelPoint(props: Geometry) {
	const [, labelX, labelY] = buildPath(props, TARGET_GAP);
	return { labelX, labelY };
}

export function getWorkflowEdgeDotPath(props: Geometry) {
	return buildPath(props, -DOT_INTO_NODE)[0];
}

export function getWorkflowEdgeStyle(
	data: WorkflowEdgeModel['data'],
	isHighlighted: boolean,
	isTestRunActive: boolean,
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
	return isTestRunActive || isHighlighted
		? { stroke: 'var(--color-action-primary)', color: 'var(--color-action-primary)' }
		: undefined;
}
