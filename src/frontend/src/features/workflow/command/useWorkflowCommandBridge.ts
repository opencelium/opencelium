import { useEffect, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import {
	deactivateWorkflowCommandBridge,
	workflowCommandBridgeStore,
} from './workflowCommandBridge';

type Params = {
	nodes: WorkflowNodeModel[];
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	reactFlowInstance: MutableRefObject<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>;
	hasOpenDialog: boolean;
};

export const useWorkflowCommandBridge = ({
	nodes,
	setNodes,
	reactFlowInstance,
	hasOpenDialog,
}: Params) => {
	const nodesRef = useRef(nodes);
	const hasOpenDialogRef = useRef(hasOpenDialog);
	useEffect(() => { nodesRef.current = nodes; }, [nodes]);
	useEffect(() => { hasOpenDialogRef.current = hasOpenDialog; }, [hasOpenDialog]);

	const setSearchHighlightedNodeIds = (ids: string[]) => {
		const matches = new Set(ids);
		setNodes((currentNodes) => currentNodes.map((node) => {
			const highlighted = matches.has(node.id);
			return !!node.data.searchHighlighted === highlighted
				? node
				: { ...node, data: { ...node.data, searchHighlighted: highlighted } };
		}));
	};

	const centerOnNode = (nodeId: string) => {
		const instance = reactFlowInstance.current;
		const node = instance?.getNode(nodeId);
		if (!instance || !node) return;
		requestAnimationFrame(() => instance.setCenter(
			node.position.x + (node.measured?.width ?? 0) / 2,
			node.position.y + (node.measured?.height ?? 0) / 2,
			{ zoom: instance.getZoom(), duration: 200 },
		));
	};

	useEffect(() => {
		workflowCommandBridgeStore.setState({
			isActive: true,
			getNodes: () => nodesRef.current,
			setSearchHighlightedNodeIds,
			hasSearchHighlights: () => nodesRef.current.some((node) => node.data.searchHighlighted),
			clearSearchHighlights: () => setSearchHighlightedNodeIds([]),
			centerOnNode,
			hasOpenDialog: () => hasOpenDialogRef.current,
		});
		return () => deactivateWorkflowCommandBridge();
	}, []);
};
