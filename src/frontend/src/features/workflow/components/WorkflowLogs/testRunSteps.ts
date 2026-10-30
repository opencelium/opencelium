import type { LiveLogTree } from '@features/logs';

/**
 * Method steps the run reached and how many of them failed, counted by position in the workflow. Only the first
 * iteration of a loop is kept locally, so an error in a later one is counted through the run's error locations.
 */
export function countSteps(tree: LiveLogTree): { total: number; failed: number } {
	const reached = new Set<string>();
	const failed = new Set<string>();
	for (const node of Object.values(tree.nodes)) {
		if (node.type !== 'OPERATION') continue;
		reached.add(node.indexPath);
		if (node.status === 'FAIL') failed.add(node.indexPath);
	}
	for (const location of tree.errorLocations) if (reached.has(location.indexPath)) failed.add(location.indexPath);
	return { total: reached.size, failed: failed.size };
}
