import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type Params = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	pinnedNodeId: string | null;
	setPinnedNodeId: Dispatch<SetStateAction<string | null>>;
	hoveredNodeId: string | null;
	setHoveredNodeId: Dispatch<SetStateAction<string | null>>;
	tableOpen: boolean;
	setTableOpen: Dispatch<SetStateAction<boolean>>;
	expandedNodeIds: string[];
	setExpandedNodeIds: Dispatch<SetStateAction<string[]>>;
	selectedKey: string | null;
	setSelectedKey: Dispatch<SetStateAction<string | null>>;
};

/** One stable object for the canvas: useBindingLens memoizes on it, so the
 *  actions must not be rebuilt per render. */
export const useBindingLensState = ({ open, setOpen, pinnedNodeId, setPinnedNodeId,
	hoveredNodeId, setHoveredNodeId, tableOpen, setTableOpen, expandedNodeIds,
	setExpandedNodeIds, selectedKey, setSelectedKey }: Params) => {
	// Hovering a method previews its bindings; clicking its badge pins them, which
	// is what makes them stay put long enough to be clicked. A pin therefore wins
	// over the pointer rather than being fought by it.
	const focusNodeId = pinnedNodeId ?? hoveredNodeId;

	const onHoverNode = useCallback((nodeId: string | null) => setHoveredNodeId(nodeId),
		[setHoveredNodeId]);

	// Pinning expands the method's own card straight away — the field rows are the
	// reason to pin, and a pin that only froze the arcs would need a second click
	// to say anything more than the hover already did.
	/** Focus a method outright, rather than toggling it — what picking a row in the
	 *  binding list means for the canvas behind it. */
	const onFocusNode = useCallback((nodeId: string) => {
		setPinnedNodeId(nodeId);
		setExpandedNodeIds([nodeId]);
	}, [setExpandedNodeIds, setPinnedNodeId]);

	const onToggleFocus = useCallback((nodeId: string) => {
		const wasPinned = pinnedNodeId === nodeId;
		setPinnedNodeId(wasPinned ? null : nodeId);
		setExpandedNodeIds(wasPinned ? [] : [nodeId]);
		if (wasPinned) setSelectedKey(null);
	}, [pinnedNodeId, setExpandedNodeIds, setPinnedNodeId, setSelectedKey]);

	const onClearFocus = useCallback(() => {
		setPinnedNodeId(null);
		setHoveredNodeId(null);
		setExpandedNodeIds([]);
	}, [setExpandedNodeIds, setHoveredNodeId, setPinnedNodeId]);

	// Expanding a pair and opening a binding both happen by clicking an arc, and an
	// arc can be on screen because the pointer is on the method it belongs to — so
	// both pin what is merely being previewed, or the click's own result would
	// vanish as the pointer left the node.
	// Read through a ref rather than a dependency: these actions are what the lens
	// elements are built with, so taking `hoveredNodeId` as a dep rebuilt every arc
	// and card on each hover transition — needless work, and enough to disturb an
	// element the pointer was sitting on.
	const hoveredNodeIdRef = useRef(hoveredNodeId);
	useEffect(() => {
		hoveredNodeIdRef.current = hoveredNodeId;
	}, [hoveredNodeId]);

	const pinPreview = useCallback(() =>
		setPinnedNodeId((current) => current ?? hoveredNodeIdRef.current),
	[setPinnedNodeId]);

	const onExpandPair = useCallback((nodeIds: string[]) => {
		setExpandedNodeIds((current) => [...new Set([...current, ...nodeIds])]);
		pinPreview();
	}, [pinPreview, setExpandedNodeIds]);

	const onCollapseCard = useCallback((nodeId: string) =>
		setExpandedNodeIds((current) => current.filter((id) => id !== nodeId)),
	[setExpandedNodeIds]);

	const onSelectBinding = useCallback((bindingKey: string) => {
		setSelectedKey(bindingKey);
		pinPreview();
	}, [pinPreview, setSelectedKey]);

	const onClearSelection = useCallback(() => setSelectedKey(null), [setSelectedKey]);

	// Focus, expansion and selection are view state of an open lens, not something
	// to restore on the next open — a reopened lens starts unfocused.
	const onToggle = useCallback(() => {
		setOpen((current) => !current);
		setPinnedNodeId(null);
		setHoveredNodeId(null);
		setExpandedNodeIds([]);
		setSelectedKey(null);
	}, [setExpandedNodeIds, setHoveredNodeId, setOpen, setPinnedNodeId, setSelectedKey]);

	const onToggleTable = useCallback(() => setTableOpen((current) => !current), [setTableOpen]);
	const onCloseTable = useCallback(() => setTableOpen(false), [setTableOpen]);

	const actions = useMemo(() => ({ onExpandPair, onCollapseCard, onSelectBinding }),
		[onCollapseCard, onExpandPair, onSelectBinding]);

	const view = useMemo(() => ({ focusNodeId, expandedNodeIds, selectedKey }),
		[expandedNodeIds, focusNodeId, selectedKey]);

	return useMemo(() => ({ open, view, pinnedNodeId, tableOpen, onToggle, onHoverNode,
		onToggleFocus, onFocusNode, onClearFocus, onToggleTable, onCloseTable, actions,
		onClearSelection, onSelectBinding }),
	[actions, onClearFocus, onClearSelection, onCloseTable, onFocusNode, onHoverNode,
		onSelectBinding, onToggle, onToggleFocus, onToggleTable, open, pinnedNodeId,
		tableOpen, view]);
};
