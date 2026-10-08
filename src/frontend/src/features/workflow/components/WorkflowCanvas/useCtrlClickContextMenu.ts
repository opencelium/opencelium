import { useCallback, type MouseEvent as ReactMouseEvent } from 'react';

type SelectableNode = { id: string; selected?: boolean };
type SelectChange = { id: string; type: 'select'; selected: boolean };

/**
 * macOS turns Ctrl + left click into a right click: the browser fires
 * `contextmenu` and never `click`, so React Flow never sees the Ctrl+click that
 * adds a node to the selection and only one node ends up selected (and copied).
 * Replays that click: toggles the node's selection the way React Flow's own
 * multi-select click does, then runs the canvas's click handler.
 */
export function useCtrlClickContextMenu<TNode extends SelectableNode>(
	onSelectChange: (changes: SelectChange[]) => void,
	onNodeClick: (event: ReactMouseEvent, node: TNode) => void,
) {
	return useCallback((event: ReactMouseEvent, node: TNode) => {
		if (!event.ctrlKey || event.button !== 0) return;
		event.preventDefault();
		onSelectChange([{ id: node.id, type: 'select', selected: !node.selected }]);
		onNodeClick(event, node);
	}, [onNodeClick, onSelectChange]);
}
