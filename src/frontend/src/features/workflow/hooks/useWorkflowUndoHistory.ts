import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowUndoSnapshot, WorkflowUndoStack } from '../types/undoHistory.types';
import { buildWorkflowUndoSignature, hasWorkflowDragPreview } from '../utils/workflowUndoHistory.utils';

/**
 * Quiet period before a state is recorded. Bursts of mutations — a multi-node
 * drag, a dialog that writes node config and field bindings in the same tick —
 * restart the timer, so they collapse into a single undo entry.
 */
const COALESCE_MS = 350;
/** Bounds a very long editing session; entries themselves are just references. */
const MAX_ENTRIES = 100;

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: unknown[] | undefined;
	isDragging: boolean;
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>;
	setEdges: Dispatch<SetStateAction<WorkflowEdgeModel[]>>;
	onFieldBindingsChange?: (fieldBindings: unknown[] | undefined) => void;
};

/**
 * In-session undo/redo for the canvas. Unrelated to the version HistoryPanel,
 * which rolls back to states that were *saved* on the backend.
 *
 * Rather than asking ~15 mutation sites to report themselves, this observes the
 * graph state and records it whenever its authored signature changes. That way
 * node adds, deletes, drags, edge changes, dialog saves and operator condition
 * edits are all covered by construction, and re-applying a snapshot needs no
 * "this came from undo" flag: the restored graph hashes back to the entry we
 * just moved to, so it is recognised as the current state instead of a new edit.
 */
export const useWorkflowUndoHistory = ({ nodes, edges, fieldBindings, isDragging,
	setNodes, setEdges, onFieldBindingsChange }: Params) => {
	const stackRef = useRef<WorkflowUndoStack>({ past: [], present: null, future: [] });
	const [{ canUndo, canRedo }, setAvailability] = useState({ canUndo: false, canRedo: false });

	const syncAvailability = useCallback(() => {
		const { past, future } = stackRef.current;
		setAvailability((current) =>
			current.canUndo === (past.length > 0) && current.canRedo === (future.length > 0)
				? current
				: { canUndo: past.length > 0, canRedo: future.length > 0 });
	}, []);

	useEffect(() => {
		// A half-finished drag is not a state worth remembering: the graph is
		// carrying ghosts/placeholders and will be rewritten on drop.
		if (isDragging || hasWorkflowDragPreview(nodes)) return;
		const timer = setTimeout(() => {
			const stack = stackRef.current;
			const signature = buildWorkflowUndoSignature(nodes, edges, fieldBindings);
			const snapshot: WorkflowUndoSnapshot = { nodes, edges, fieldBindings, signature };
			if (stack.present?.signature === signature) {
				// Same edit, newer objects (selection, measured sizes) — keep the
				// fresher references so a later undo/redo round-trip doesn't
				// resurrect stale render state.
				stack.present = snapshot;
				return;
			}
			if (stack.present) {
				stack.past.push(stack.present);
				if (stack.past.length > MAX_ENTRIES) stack.past.shift();
				stack.future = [];
			}
			stack.present = snapshot;
			syncAvailability();
		}, COALESCE_MS);
		return () => clearTimeout(timer);
	}, [nodes, edges, fieldBindings, isDragging, syncAvailability]);

	const applySnapshot = useCallback((snapshot: WorkflowUndoSnapshot) => {
		setNodes(snapshot.nodes);
		setEdges(snapshot.edges);
		onFieldBindingsChange?.(snapshot.fieldBindings);
	}, [setNodes, setEdges, onFieldBindingsChange]);

	const undo = useCallback(() => {
		const stack = stackRef.current;
		const previous = stack.past[stack.past.length - 1];
		if (!previous || !stack.present) return;
		stack.past.pop();
		stack.future.unshift(stack.present);
		stack.present = previous;
		applySnapshot(previous);
		syncAvailability();
	}, [applySnapshot, syncAvailability]);

	const redo = useCallback(() => {
		const stack = stackRef.current;
		const next = stack.future[0];
		if (!next || !stack.present) return;
		stack.future.shift();
		stack.past.push(stack.present);
		stack.present = next;
		applySnapshot(next);
		syncAvailability();
	}, [applySnapshot, syncAvailability]);

	/** Drops the stack, then re-seeds from whatever lands next. Called whenever
	 * the graph is replaced wholesale (connection load, template apply, version
	 * rollback) — those states did not come from in-session edits, so undoing
	 * "through" them would splice two unrelated workflows together. */
	const reset = useCallback(() => {
		stackRef.current = { past: [], present: null, future: [] };
		syncAvailability();
	}, [syncAvailability]);

	return { canUndo, canRedo, undo, redo, reset };
};
