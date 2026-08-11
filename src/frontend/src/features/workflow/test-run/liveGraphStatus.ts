import type { ExecutionSocketLog, LogStatus } from '@features/logs';
import { buildWorkflowIndexes } from '../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

// A flat, non-memory-bounded counterpart to LiveLogTree (see liveLogTree.ts),
// used only to drive the workflow canvas's live test-run animation. LiveLogTree
// deliberately keeps only a loop's FIRST iteration in memory (bounded cost for
// a loop with a million iterations), which is right for the log viewer but
// means it stops reflecting reality for anything nested inside a loop once
// that loop moves past its first pass. This tracker instead keeps exactly one
// entry per graph node (keyed by its workflow tree-path index), continuously
// overwritten by the latest socket line — O(graph size), never O(iterations).
export type LiveGraphNodeStatus = {
	status: LogStatus;
	// IF nodes only: which branch was taken, from the latest line seen.
	ifResult?: 'true' | 'false';
	// LOOP nodes only: iterator name and the running count for the CURRENT
	// (active) invocation — reset to 1 whenever an enclosing loop advances to a
	// new iteration, so a nested loop's counter starts fresh each time it reruns.
	// Always displayed: the paced playback (see playbackQueue.ts) guarantees
	// iterations tick at a watchable speed however fast the real run was.
	iterator?: string;
	iterationCount?: number;
	// Set when this node is where an error actually happened (see error
	// attribution in reduceLiveGraphStatus) — drives the canvas's red
	// failure marking and pan-to-node reveal.
	errorMessage?: string;
	// Internal bookkeeping for the reset-on-new-invocation rule; not meant to
	// be read by consumers.
	iterationContext?: string;
	lastIterationValue?: string;
};

export type LiveGraphStatus = Record<string, LiveGraphNodeStatus>;

export const EMPTY_LIVE_GRAPH_STATUS: LiveGraphStatus = {};

// For every node, the indexPaths of its enclosing LOOP ancestors, outermost
// first — positionally aligned with a socket line's comma-separated
// `properties.loopIndex` (e.g. a line inside Loop1 > Loop2 has loopIndex
// "2,5" and ancestors [Loop1.index, Loop2.index]). Recompute only when the
// graph's structure changes (see index.tsx), not per socket message.
export const buildLoopAncestorsByIndexPath = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): Map<string, string[]> => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const nodeByIndex = new Map<string, WorkflowNodeModel>();
	indexes.forEach((index, nodeId) => {
		const node = nodeById.get(nodeId);
		if (node) nodeByIndex.set(index, node);
	});

	const getAncestorPrefixes = (index: string) => {
		const segments = index.split('_');
		const prefixes: string[] = [];
		for (let take = 1; take < segments.length; take += 1) prefixes.push(segments.slice(0, take).join('_'));
		return prefixes;
	};

	const result = new Map<string, string[]>();
	indexes.forEach((index) => {
		const loopAncestors = getAncestorPrefixes(index).filter((prefix) => nodeByIndex.get(prefix)?.type === 'loop');
		result.set(index, loopAncestors);
	});
	return result;
};

// Folds one raw socket line into the tracker. Every line updates its own
// node's status (and IF result/iterator, when present) unconditionally, then
// bumps the iteration counter of every enclosing loop whose position in
// `loopIndex` just changed value — regardless of how deep the line is nested
// or how many times an outer loop has already gone around. Finally, if the
// line carries an error, attributes it to where it actually happened, which
// may be a different element than the one carrying it (e.g. the run's final
// EXECUTION/FAIL line, which has no indexPath of its own) — mirrors
// attachError in liveLogTree.ts.
export const reduceLiveGraphStatus = (
	current: LiveGraphStatus,
	log: ExecutionSocketLog,
	loopAncestorsByIndexPath: Map<string, string[]>,
): LiveGraphStatus => {
	let next = current;

	if (log.indexPath) {
		next = { ...next };
		next[log.indexPath] = {
			...next[log.indexPath],
			status: log.status,
			...(log.segment?.result ? { ifResult: log.segment.result } : {}),
			...(log.type === 'LOOP' && log.properties?.iterator ? { iterator: log.properties.iterator } : {}),
		};

		const loopIndexParts = (log.properties?.loopIndex ?? '').split(',').filter(Boolean);
		const ancestors = loopAncestorsByIndexPath.get(log.indexPath) ?? [];
		ancestors.forEach((loopPath, position) => {
			const value = loopIndexParts[position];
			if (value === undefined) return;
			const context = loopIndexParts.slice(0, position).join(',');
			const existing = next[loopPath];
			if (!existing || existing.iterationContext !== context) {
				// Fresh invocation of this loop — it is definitely running again right
				// now, so status always resets to PENDING here, even if the previous
				// invocation left it COMPLETE/FAIL.
				next[loopPath] = {
					...existing,
					status: 'PENDING',
					iterationContext: context,
					lastIterationValue: value,
					iterationCount: 1,
				};
			} else if (existing.lastIterationValue !== value) {
				next[loopPath] = {
					...existing,
					lastIterationValue: value,
					iterationCount: (existing.iterationCount ?? 0) + 1,
				};
			}
		});
	}

	const errorTargetPath = log.error?.originOfErrorPath || log.indexPath;
	if (log.error?.message && errorTargetPath) {
		if (next === current) next = { ...current };
		const target = next[errorTargetPath];
		next[errorTargetPath] = {
			...target,
			status: !target || target.status === 'PENDING' ? 'FAIL' : target.status,
			errorMessage: target?.errorMessage ?? log.error.message,
		};
	}

	return next;
};

// Once a run is over (failed, terminated, or the socket dropped) nothing is
// in flight anymore — flip still-pending nodes to FAIL so the canvas's
// "active" animation (driven off PENDING entries, see getTestRunScope) stops.
// This does NOT paint those nodes red: the red failure marking is keyed on
// errorMessage (error attribution above), so only the node where the error
// actually happened stays marked — stopping a test mid-loop must not turn
// every running loop red. Deliberately NOT cleared, unlike a normal run
// start: the failure marker should stay on the graph until the next test run
// begins, not vanish the instant this one ends.
export const failPendingGraphStatus = (status: LiveGraphStatus): LiveGraphStatus => {
	const entries = Object.entries(status);
	if (!entries.some(([, node]) => node.status === 'PENDING')) return status;
	const next = { ...status };
	for (const [indexPath, node] of entries) {
		if (node.status === 'PENDING') next[indexPath] = { ...node, status: 'FAIL' };
	}
	return next;
};
