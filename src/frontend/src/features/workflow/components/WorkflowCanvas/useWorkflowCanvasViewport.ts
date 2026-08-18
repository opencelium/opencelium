import { useEffect, useRef } from 'react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';

const VIEWPORT_OFFSET = { x: 200, y: 140 };

const positionGraphNearTopLeft = (
	instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>,
	nodes: WorkflowNodeModel[],
	zoom: number,
) => {
	if (nodes.length === 0) return;
	const minX = Math.min(...nodes.map((node) => node.position.x));
	const minY = Math.min(...nodes.map((node) => node.position.y));
	requestAnimationFrame(() => instance.setViewport({
		x: VIEWPORT_OFFSET.x - minX * zoom,
		y: VIEWPORT_OFFSET.y - minY * zoom,
		zoom,
	}, { duration: 0 }));
};

export const useWorkflowCanvasViewport = ({ nodes, restoredViewport,
	viewportRestoreVersion, centerStartVersion, onInit }: {
	nodes: WorkflowNodeModel[];
	restoredViewport?: Viewport;
	viewportRestoreVersion: number;
	centerStartVersion: number;
	onInit?: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => void;
}) => {
	const instanceRef = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
	const appliedViewportKey = useRef<string | undefined>(undefined);
	const centeredVersion = useRef(0);
	const viewportKey = restoredViewport
		? `${viewportRestoreVersion}:${restoredViewport.x}:${restoredViewport.y}:${restoredViewport.zoom}`
		: undefined;

	useEffect(() => {
		if (!restoredViewport || !instanceRef.current
			|| appliedViewportKey.current === viewportKey) return;
		appliedViewportKey.current = viewportKey;
		requestAnimationFrame(() => instanceRef.current
			?.setViewport(restoredViewport, { duration: 0 }));
	}, [restoredViewport, viewportKey]);

	useEffect(() => {
		if (!centerStartVersion || centeredVersion.current === centerStartVersion
			|| !instanceRef.current) return;
		centeredVersion.current = centerStartVersion;
		positionGraphNearTopLeft(instanceRef.current, nodes, restoredViewport?.zoom ?? 1);
	}, [centerStartVersion, nodes, restoredViewport?.zoom]);

	const handleInit = (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => {
		instanceRef.current = instance;
		onInit?.(instance);
		if (centerStartVersion && centeredVersion.current !== centerStartVersion) {
			centeredVersion.current = centerStartVersion;
			positionGraphNearTopLeft(instance, nodes, restoredViewport?.zoom ?? 1);
		}
	};

	return { handleInit, instanceRef };
};
