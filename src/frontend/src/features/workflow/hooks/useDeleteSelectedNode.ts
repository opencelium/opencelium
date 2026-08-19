import { useEffect, useRef } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	readOnly: boolean;
	disabled: boolean;
	nodes: WorkflowNodeModel[];
	onDeleteNode: (nodeId: string) => Promise<void> | void;
};

export const useDeleteSelectedNode = ({ readOnly, disabled, nodes,
	onDeleteNode }: Params) => {
	const deleteSelectedRef = useRef(() => {});
	deleteSelectedRef.current = () => {
		if (readOnly || disabled) return;
		const selected = nodes.find((node) => node.selected && node.type !== 'start');
		if (selected) void onDeleteNode(selected.id);
	};

	useEffect(() => {
		const handleDelete = (event: KeyboardEvent) => {
			if (event.key !== 'Delete') return;
			const target = event.target as HTMLElement | null;
			if (target?.closest(EDITABLE_TARGET_SELECTOR)) return;
			deleteSelectedRef.current();
		};
		window.addEventListener('keydown', handleDelete);
		return () => window.removeEventListener('keydown', handleDelete);
	}, []);
};
