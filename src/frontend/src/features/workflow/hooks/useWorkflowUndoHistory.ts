import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowUndoEntry, WorkflowUndoSnapshot,
	WorkflowUndoStack } from '../types/undoHistory.types';
import { buildWorkflowUndoSignature, hasWorkflowDragPreview } from '../utils/workflowUndoHistory.utils';
import { describeWorkflowUndoChange } from '../utils/workflowUndoDescribe.utils';

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
	// Newest first: pending redos, then the current state, then the undo trail.
	// `offset` is the jump distance from the current state, so the menu can hand
	// a row straight back to `jumpTo`.
	const [entries, setEntries] = useState<WorkflowUndoEntry[]>([]);

	const syncEntries = useCallback(() => {
		const { past, present, future } = stackRef.current;
		if (!present) {
			setEntries((current) => current.length === 0 ? current : []);
			return;
		}
		const next: WorkflowUndoEntry[] = [
			...future.map((snapshot, index) => ({
				offset: future.length - index, change: snapshot.change, at: snapshot.at,
			})).reverse(),
			{ offset: 0, change: present.change, at: present.at },
			...[...past].reverse().map((snapshot, index) => ({
				offset: -(index + 1), change: snapshot.change, at: snapshot.at,
			})),
		];
		// Hand back the same array when nothing moved, so consumers of `entries`
		// don't re-render on a no-op sync.
		setEntries((current) => current.length === next.length
			&& current.every((entry, index) => entry.offset === next[index].offset
				&& entry.change === next[index].change && entry.at === next[index].at)
			? current
			: next);
	}, []);

	useEffect(() => {
		// A half-finished drag is not a state worth remembering: the graph is
		// carrying ghosts/placeholders and will be rewritten on drop.
		if (isDragging || hasWorkflowDragPreview(nodes)) return;
		const timer = setTimeout(() => {
			const stack = stackRef.current;
			const signature = buildWorkflowUndoSignature(nodes, edges, fieldBindings);
			if (stack.present?.signature === signature) {
				// Same edit, newer objects (selection, measured sizes) — keep the
				// fresher references so a later undo/redo round-trip doesn't
				// resurrect stale render state, and keep the existing label.
				stack.present = { ...stack.present, nodes, edges, fieldBindings };
				return;
			}
			const change = stack.present
				? describeWorkflowUndoChange(stack.present, { nodes, edges, fieldBindings })
				: ({ kind: 'initial' } as const);
			const snapshot: WorkflowUndoSnapshot = { nodes, edges, fieldBindings, signature,
				change, at: Date.now() };
			if (stack.present) {
				stack.past.push(stack.present);
				if (stack.past.length > MAX_ENTRIES) stack.past.shift();
				stack.future = [];
			}
			stack.present = snapshot;
			syncEntries();
		}, COALESCE_MS);
		return () => clearTimeout(timer);
	}, [nodes, edges, fieldBindings, isDragging, syncEntries]);

	const applySnapshot = useCallback((snapshot: WorkflowUndoSnapshot) => {
		setNodes(snapshot.nodes);
		setEdges(snapshot.edges);
		onFieldBindingsChange?.(snapshot.fieldBindings);
	}, [setNodes, setEdges, onFieldBindingsChange]);

	/** Moves `offset` steps along the stack (negative = undo, positive = redo)
	 * and applies the state it lands on — one graph write, however far it walks.
	 * Stops early rather than throwing if the stack is shorter than asked. */
	const jumpTo = useCallback((offset: number) => {
		const stack = stackRef.current;
		if (!offset || !stack.present) return;
		let remaining = Math.abs(offset);
		while (remaining > 0) {
			if (offset < 0) {
				const previous = stack.past.pop();
				if (!previous) break;
				stack.future.unshift(stack.present);
				stack.present = previous;
			} else {
				const next = stack.future.shift();
				if (!next) break;
				stack.past.push(stack.present);
				stack.present = next;
			}
			remaining -= 1;
		}
		applySnapshot(stack.present);
		syncEntries();
	}, [applySnapshot, syncEntries]);

	const undo = useCallback(() => jumpTo(-1), [jumpTo]);
	const redo = useCallback(() => jumpTo(1), [jumpTo]);

	/** Drops the stack, then re-seeds from whatever lands next. Called whenever
	 * the graph is replaced wholesale (connection load, template apply, version
	 * rollback) — those states did not come from in-session edits, so undoing
	 * "through" them would splice two unrelated workflows together. */
	const reset = useCallback(() => {
		stackRef.current = { past: [], present: null, future: [] };
		syncEntries();
	}, [syncEntries]);

	return {
		entries,
		canUndo: entries.some((entry) => entry.offset < 0),
		canRedo: entries.some((entry) => entry.offset > 0),
		undo,
		redo,
		jumpTo,
		reset,
	};
};
