import { useEffect } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	disabled: boolean;
	nodes: WorkflowNodeModel[];
	onDuplicateNode: (nodeId: string) => void;
};

export const useDuplicateSelectedNodeShortcut = ({ disabled, nodes,
	onDuplicateNode }: Params) => {
	useEffect(() => {
		const handleDuplicate = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'd') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR) || disabled) return;
			const selected = nodes.find((node) =>
				node.selected && node.type !== 'start' && node.type !== 'comment');
			if (!selected) return;
			event.preventDefault();
			onDuplicateNode(selected.id);
		};
		window.addEventListener('keydown', handleDuplicate);
		return () => window.removeEventListener('keydown', handleDuplicate);
	}, [disabled, nodes, onDuplicateNode]);
};
