import type { ExecutionSocketLog } from '@features/logs';

// Which socket lines represent the process ARRIVING at an element — the
// events that advance the playback's travelling token (and get the full
// node-switch dwell in playbackQueue). The backend's grammar, observed live:
//  - IF and LOOP elements emit PENDING when entered and COMPLETE when left;
//  - methods (OPERATION) emit NO PENDING at all — their single COMPLETE line
//    is the only trace they ran.
// So a method's COMPLETE is its step; an operator's COMPLETE is not (stepping
// on it would move the token backwards onto an element it already left).
export const isStepLine = (log: ExecutionSocketLog): boolean =>
	!!log.indexPath &&
	(log.status === 'PENDING' || (log.status === 'COMPLETE' && log.type === 'OPERATION'));

export type StepMeta = {
	indexPath: string;
	// The line's comma-separated loop iteration context — distinguishes a
	// re-entry of the same element on the next iteration (a real transition)
	// from a duplicate line within the same iteration.
	loopIndex: string;
};

// Decides whether `log` moves the token to a new step, given the step the
// token is currently on. Returns the new step, or null to stay put.
export const getNextStep = (
	log: ExecutionSocketLog,
	previous: StepMeta | null,
): StepMeta | null => {
	if (!isStepLine(log) || !log.indexPath) return null;
	const next: StepMeta = { indexPath: log.indexPath, loopIndex: log.properties?.loopIndex ?? '' };
	if (!previous) return next;
	// Same element, same iteration — a duplicate, not a transition.
	if (previous.indexPath === next.indexPath && previous.loopIndex === next.loopIndex) return null;
	// The socket occasionally delivers one iteration's lines out of order
	// (e.g. the sibling IF's PENDING before the method's COMPLETE). Within the
	// same iteration context the process only moves forward through the tree,
	// so a line for an EARLIER element is stale — stepping on it would visibly
	// hop the token backwards. A different context (next iteration) genuinely
	// moves backwards in the tree and is always allowed.
	if (previous.loopIndex === next.loopIndex && compareTreePath(next.indexPath, previous.indexPath) < 0) {
		return null;
	}
	return next;
};

// Numeric segment-wise order of workflow tree paths ("1_0_2" < "1_0_10");
// an ancestor prefix sorts before its descendants.
const compareTreePath = (a: string, b: string): number => {
	const aSegments = a.split('_').map(Number);
	const bSegments = b.split('_').map(Number);
	const length = Math.max(aSegments.length, bSegments.length);
	for (let i = 0; i < length; i += 1) {
		const aValue = aSegments[i];
		const bValue = bSegments[i];
		if (aValue === undefined) return -1;
		if (bValue === undefined) return 1;
		if (aValue !== bValue) return aValue - bValue;
	}
	return 0;
};
