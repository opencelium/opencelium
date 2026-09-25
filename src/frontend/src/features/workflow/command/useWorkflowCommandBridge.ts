import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import {
	deactivateWorkflowCommandBridge,
	workflowCommandBridgeStore,
} from './workflowCommandBridge';

type Params = {
	nodes: WorkflowNodeModel[];
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	centerOnNode: (nodeId: string) => void;
	hasOpenDialog: boolean;
};

export const useWorkflowCommandBridge = ({
	nodes,
	setNodes,
	centerOnNode,
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
