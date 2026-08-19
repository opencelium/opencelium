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
	// Internal bookkeeping for the reset-on-new-invocation rule.
	iterationContext?: string;
	// The loop's current iteration index (0-based, as a string — same format as
	// LiveLogNode.loopIndex/ErrorLocation.loopIndex) — the last value seen for
	// THIS loop's own position in an incoming line's comma-separated
	// properties.loopIndex. Undefined until the loop has run at least once.
	// Public: ResponseDialog reads this (for every LOOP ancestor of a node) to
	// resolve which iteration a node inside a loop was last executed in, when
	// looking up its live response while the run is paused.
	lastIterationValue?: string;
};

export type LiveGraphStatus = Record<string, LiveGraphNodeStatus>;

export const EMPTY_LIVE_GRAPH_STATUS: LiveGraphStatus = {};

// For a node at `indexPath`, its current loop-iteration context — the
// comma-separated CURRENT iteration index of every enclosing LOOP ancestor
// (outermost first, from `loopAncestorsByIndexPath`), read from each
// ancestor's `lastIterationValue`. Same shape as LiveLogNode.loopIndex /
// ErrorLocation.loopIndex, so the result feeds directly into
// resolveTraceTarget. Used to resolve which iteration's execution to look up
// for a node nested inside one or more loops (see ResponseDialog) — a loop
// that hasn't run yet (undefined lastIterationValue) contributes '0', the
// only iteration that could possibly exist yet.
export const resolveCurrentLoopIndex = (
	indexPath: string,
	loopAncestorsByIndexPath: Map<string, string[]>,
	liveGraphStatus: LiveGraphStatus,
): string =>
	(loopAncestorsByIndexPath.get(indexPath) ?? [])
		.map((loopPath) => liveGraphStatus[loopPath]?.lastIterationValue ?? '0')
		.join(',');

// For a node at `indexPath`, a lookup from an iterator NAME — as it appears
// inside a reference path's `[name]` segment, e.g. "[i]" — to that ancestor
// loop's current 0-based iteration index. Built from the same ancestor loops
// resolveCurrentLoopIndex reads above, matched by each loop's own `iterator`
// name (the live socket line's properties.iterator — the same name
// getIteratorsForIndex in requestReferenceOptions.ts uses to build reference
// paths in the first place, so this can never disagree with what a saved
// reference actually means). Used by readLiveValueAtPath to resolve which
// element of an array a `[<iterator>]` reference segment currently points
// at. Returns null for a name that isn't any ancestor's iterator, rather
// than guessing — the caller then bails instead of reading the wrong element.
export const buildIteratorIndexResolver = (
	indexPath: string,
	loopAncestorsByIndexPath: Map<string, string[]>,
	liveGraphStatus: LiveGraphStatus,
): ((iteratorName: string) => number | null) => {
	const byName = new Map<string, number>();
	for (const loopPath of loopAncestorsByIndexPath.get(indexPath) ?? []) {
		const status = liveGraphStatus[loopPath];
		if (status?.iterator && status.lastIterationValue !== undefined) {
			byName.set(status.iterator, Number(status.lastIterationValue));
		}
	}
	return (iteratorName) => byName.get(iteratorName) ?? null;
};

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
