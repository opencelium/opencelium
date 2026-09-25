import { useEffect } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	disabled: boolean;
	nodes: WorkflowNodeModel[];
	onCopyNode: (nodeId: string) => void;
};

export const useCopySelectedNodeShortcut = ({ disabled, nodes, onCopyNode }: Params) => {
	useEffect(() => {
		const handleCopy = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'c') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR)) return;
			if (disabled) return;
			const selected = nodes.find((node) =>
				node.selected && node.type !== 'start' && node.type !== 'comment');
			if (!selected) return;
			event.preventDefault();
			onCopyNode(selected.id);
		};
		window.addEventListener('keydown', handleCopy);
		return () => window.removeEventListener('keydown', handleCopy);
	}, [disabled, nodes, onCopyNode]);
};
