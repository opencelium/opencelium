import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { createNodeFromAction } from '../utils/createNodeFromAction';
import {
	deactivateWorkflowCommandBridge,
	workflowCommandBridgeStore,
} from './workflowCommandBridge';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	setEdges: Dispatch<SetStateAction<WorkflowEdgeModel[]>>;
	centerOnNode: (nodeId: string) => void;
	hasOpenDialog: boolean;
};

export const useWorkflowCommandBridge = ({
	nodes,
	edges,
	setNodes,
	setEdges,
	centerOnNode,
	hasOpenDialog,
}: Params) => {
	const nodesRef = useRef(nodes);
	const edgesRef = useRef(edges);
	const hasOpenDialogRef = useRef(hasOpenDialog);
	useEffect(() => { nodesRef.current = nodes; }, [nodes]);
	useEffect(() => { edgesRef.current = edges; }, [edges]);
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

	const addStep = (action: WorkflowAction): string | null => {
		const existing = new Set(nodesRef.current.map((node) => node.id));
		const result = createNodeFromAction({ action, nodes: nodesRef.current, edges: edgesRef.current });
		const added = result.nodes.find((node) => !existing.has(node.id));
		if (!added) return null;
		// Ahead of the re-render, so a second add in the same tick builds on this one.
		nodesRef.current = result.nodes;
		edgesRef.current = result.edges;
		setNodes(result.nodes);
		setEdges(result.edges);
		return added.id;
	};

	useEffect(() => {
		workflowCommandBridgeStore.setState({
			isActive: true,
			getNodes: () => nodesRef.current,
			getEdges: () => edgesRef.current,
			setSearchHighlightedNodeIds,
			hasSearchHighlights: () => nodesRef.current.some((node) => node.data.searchHighlighted),
			clearSearchHighlights: () => setSearchHighlightedNodeIds([]),
			centerOnNode,
			hasOpenDialog: () => hasOpenDialogRef.current,
			addStep,
		});
		return () => deactivateWorkflowCommandBridge();
	}, []);
};
