import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type Params = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	expandedNodeIds: string[];
	setExpandedNodeIds: Dispatch<SetStateAction<string[]>>;
	selectedKey: string | null;
	setSelectedKey: Dispatch<SetStateAction<string | null>>;
};

/** One stable object for the canvas: useBindingLens memoizes on it, so the
 *  actions must not be rebuilt per render. */
export const useBindingLensState = ({ open, setOpen, expandedNodeIds,
	setExpandedNodeIds, selectedKey, setSelectedKey }: Params) => {
	const onExpandPair = useCallback((nodeIds: string[]) =>
		setExpandedNodeIds((current) => [...new Set([...current, ...nodeIds])]),
	[setExpandedNodeIds]);

	const onCollapseCard = useCallback((nodeId: string) =>
		setExpandedNodeIds((current) => current.filter((id) => id !== nodeId)),
	[setExpandedNodeIds]);

	const onSelectBinding = useCallback((bindingKey: string) => setSelectedKey(bindingKey),
		[setSelectedKey]);

	const onClearSelection = useCallback(() => setSelectedKey(null), [setSelectedKey]);

	// Expansion and selection are view state of an open lens, not something to
	// restore on the next open — a reopened lens starts collapsed and unselected.
	const onToggle = useCallback(() => {
		setOpen((current) => !current);
		setExpandedNodeIds([]);
		setSelectedKey(null);
	}, [setExpandedNodeIds, setOpen, setSelectedKey]);

	const actions = useMemo(() => ({ onExpandPair, onCollapseCard, onSelectBinding }),
		[onCollapseCard, onExpandPair, onSelectBinding]);

	const view = useMemo(() => ({ expandedNodeIds, selectedKey }),
		[expandedNodeIds, selectedKey]);

	return useMemo(() => ({ open, view, onToggle, actions, onClearSelection }),
		[actions, onClearSelection, onToggle, open, view]);
};
