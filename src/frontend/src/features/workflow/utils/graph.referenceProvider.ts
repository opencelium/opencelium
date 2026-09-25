import { compareWorkflowIndexes, isWorkflowReferenceVisible } from './graph.referenceVisibility';

// Which method a reference actually reads from, when several carry the colour it
// names: the visible one that runs last before the consumer. Reference colours
// identify a single method instance today, so this normally has one candidate —
// but the rule has to stay explicit, because picking the wrong candidate inside a
// loop silently repoints a binding at a different iteration's method.
export const pickNearestVisibleProvider = <T>(
	candidates: T[],
	getIndex: (candidate: T) => string | undefined,
	consumerIndex?: string,
): T | null =>
	candidates
		.filter((candidate) => isWorkflowReferenceVisible(getIndex(candidate), consumerIndex))
		.sort((left, right) =>
			compareWorkflowIndexes(getIndex(right) ?? '', getIndex(left) ?? ''))[0] ?? null;
