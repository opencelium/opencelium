import { useEffect, useRef } from 'react';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	readOnly: boolean;
	disabled: boolean;
	nodes: WorkflowNodeModel[];
	onDeleteNodes: (nodeIds: string[]) => Promise<void> | void;
};

// Backspace is what a Mac keyboard's delete key sends.
const DELETE_KEYS = new Set(['Delete', 'Backspace']);

export const useDeleteSelectedNode = ({ readOnly, disabled, nodes,
	onDeleteNodes }: Params) => {
	const deleteSelectedRef = useRef<() => boolean>(() => false);
	deleteSelectedRef.current = () => {
		if (readOnly || disabled) return false;
		const selectedIds = nodes.filter((node) => node.selected && node.type !== 'start')
			.map((node) => node.id);
		if (selectedIds.length === 0) return false;
		void onDeleteNodes(selectedIds);
		return true;
	};

	useEffect(() => {
		const handleDelete = (event: KeyboardEvent) => {
			if (!DELETE_KEYS.has(event.key)) return;
			const target = event.target as HTMLElement | null;
			if (target?.closest(EDITABLE_TARGET_SELECTOR)) return;
			if (deleteSelectedRef.current()) event.preventDefault();
		};
		window.addEventListener('keydown', handleDelete);
		return () => window.removeEventListener('keydown', handleDelete);
	}, []);
};
