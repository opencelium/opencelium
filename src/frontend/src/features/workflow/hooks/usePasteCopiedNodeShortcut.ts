import { useEffect } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	disabled: boolean;
	copiedNodeIds: string[];
	nodes: WorkflowNodeModel[];
	onPasteNodes: (sourceNodeIds: string[], targetNodeId: string) => void;
	onChooseOperatorPlacement: (sourceNodeIds: string[], targetNodeId: string) => void;
};

export const usePasteCopiedNodeShortcut = ({ disabled, copiedNodeIds, nodes,
	onPasteNodes, onChooseOperatorPlacement }: Params) => {
	useEffect(() => {
		const handlePaste = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'v') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR) || disabled || copiedNodeIds.length === 0) return;
			const copiedNodesExist = copiedNodeIds.every((id) => nodes.some((node) => node.id === id));
			const targetNode = nodes.find((node) =>
				node.selected && node.type !== 'comment');
			if (!copiedNodesExist || !targetNode) return;
			event.preventDefault();
			if (targetNode.type === 'if' || targetNode.type === 'loop') {
				onChooseOperatorPlacement(copiedNodeIds, targetNode.id);
			} else {
				onPasteNodes(copiedNodeIds, targetNode.id);
			}
		};
		window.addEventListener('keydown', handlePaste);
		return () => window.removeEventListener('keydown', handlePaste);
	}, [disabled, copiedNodeIds, nodes, onPasteNodes, onChooseOperatorPlacement]);
};
