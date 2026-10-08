import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type SimulatedWorkflowGraph = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	/** Untyped legacy binding data, like the editor's own `fieldBindings`. */
	fieldBindings: unknown[];
};

/**
 * A graph to put on an empty /workflow/create canvas. Registered by the workflow
 * tutorial when it is opened on a later step (`?tutorialStep=`), so that step finds
 * the nodes the earlier ones would have built — mirrors `simulatedSchedulesConnection`.
 *
 * The editor keeps its graph in local state and mounts before the tutorial starts, so
 * this is watched rather than read once at mount.
 */
let graph: SimulatedWorkflowGraph | null = null;
const listeners = new Set<() => void>();

export function setSimulatedWorkflowGraph(next: SimulatedWorkflowGraph | null): void {
	if (graph === next) return;
	graph = next;
	listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getSnapshot = () => graph;

/**
 * Applies each registered graph once. Only where `isEnabled` — the create page, which
 * has no saved connection whose graph this could overwrite.
 */
export function useSimulatedWorkflowGraph(
	isEnabled: boolean,
	apply: (graph: SimulatedWorkflowGraph) => void,
): void {
	const current = useSyncExternalStore(subscribe, getSnapshot, () => null);
	const appliedRef = useRef<SimulatedWorkflowGraph | null>(null);
	useEffect(() => {
		if (!isEnabled || !current || appliedRef.current === current) return;
		appliedRef.current = current;
		apply(current);
	}, [isEnabled, current, apply]);
}
