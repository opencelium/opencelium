import { useEffect } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	disabled: boolean;
	copiedNodeId: string | null;
	nodes: WorkflowNodeModel[];
	onPasteNode: (sourceNodeId: string, targetNodeId: string) => void;
	onChooseOperatorPlacement: (sourceNodeId: string, targetNodeId: string) => void;
};

export const usePasteCopiedNodeShortcut = ({ disabled, copiedNodeId, nodes,
	onPasteNode, onChooseOperatorPlacement }: Params) => {
	useEffect(() => {
		const handlePaste = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'v') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR) || disabled || !copiedNodeId) return;
			const copiedNode = nodes.find((node) => node.id === copiedNodeId);
			const targetNode = nodes.find((node) =>
				node.selected && node.type !== 'comment');
			if (!copiedNode || !targetNode) return;
			event.preventDefault();
			if (targetNode.type === 'if' || targetNode.type === 'loop') {
				onChooseOperatorPlacement(copiedNode.id, targetNode.id);
			} else {
				onPasteNode(copiedNode.id, targetNode.id);
			}
		};
		window.addEventListener('keydown', handlePaste);
		return () => window.removeEventListener('keydown', handlePaste);
	}, [disabled, copiedNodeId, nodes, onPasteNode, onChooseOperatorPlacement]);
};
