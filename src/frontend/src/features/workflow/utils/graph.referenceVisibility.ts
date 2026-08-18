import type { WorkflowNodeModel } from '../types/workflow.types';

/** A joint, expressed in workflow-index space: the target of `to` additionally
 * sees everything the method at `from` sees, plus that method itself. */
export type WorkflowJumpLink = { from: string; to: string };

const parseIndex = (value: string) => value.split('_')
	.map((part) => Number(part))
	.map((part) => Number.isFinite(part) ? part : 0);

export const compareWorkflowIndexes = (left: string, right: string) => {
	const leftPath = parseIndex(left);
	const rightPath = parseIndex(right);
	const length = Math.max(leftPath.length, rightPath.length);
	for (let index = 0; index < length; index += 1) {
		const leftPart = leftPath[index] ?? -1;
		const rightPart = rightPath[index] ?? -1;
		if (leftPart !== rightPart) return leftPart - rightPart;
	}
	return leftPath.length - rightPath.length;
};

const isSamePath = (left: number[], right: number[]) =>
	left.length === right.length && left.every((part, index) => part === right[index]);

const isPathPrefix = (prefix: number[], path: number[]) =>
	prefix.length < path.length && prefix.every((part, index) => part === path[index]);

const isDirectlyVisible = (providerIndex: string, consumerIndex: string) => {
	if (compareWorkflowIndexes(providerIndex, consumerIndex) >= 0) return false;
	const providerPath = parseIndex(providerIndex);
	const consumerPath = parseIndex(consumerIndex);
	if (isPathPrefix(providerPath, consumerPath)) return true;
	for (let level = consumerPath.length - 1; level >= 0; level -= 1) {
		const parentPath = consumerPath.slice(0, level);
		const consumerSegment = consumerPath[level];
		if (providerPath.length !== level + 1) continue;
		if (!isSamePath(providerPath.slice(0, level), parentPath)) continue;
		if ((providerPath[level] ?? -1) < consumerSegment) return true;
	}
	return false;
};

/**
 * Whether the method at `providerIndex` can be referenced from `consumerIndex`.
 *
 * Without joints this is pure index arithmetic: a provider must run earlier and
 * live either on an ancestor chain of the consumer or directly before it in the
 * consumer's own chain. Each joint widens that: whoever sees the joint's target
 * also sees its source and everything the source itself sees, so the joint's
 * visibility is followed transitively (chained joints included, cycle-safe).
 */
export const isWorkflowReferenceVisible = (
	providerIndex?: string,
	consumerIndex?: string,
	jumps: WorkflowJumpLink[] = [],
) => {
	if (!providerIndex || !consumerIndex) return false;
	if (isDirectlyVisible(providerIndex, consumerIndex)) return true;
	if (jumps.length === 0) return false;

	const visited = new Set<string>();
	const queue = [consumerIndex];
	while (queue.length) {
		const current = queue.shift();
		if (!current || visited.has(current)) continue;
		visited.add(current);
		for (const jump of jumps) {
			const inherits = jump.to === current || isDirectlyVisible(jump.to, current);
			if (!inherits) continue;
			if (jump.from === providerIndex || isDirectlyVisible(providerIndex, jump.from)) return true;
			queue.push(jump.from);
		}
	}
	return false;
};

export const collectWorkflowJumpLinks = (
	nodes: WorkflowNodeModel[],
	indexes: Map<string, string>,
): WorkflowJumpLink[] => nodes.flatMap((node) => {
	const targetId = node.data.jumpTo;
	if (!targetId) return [];
	const from = indexes.get(node.id);
	const to = indexes.get(targetId);
	return from && to ? [{ from, to }] : [];
});
