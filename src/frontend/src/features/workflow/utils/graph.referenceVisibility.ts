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

export const isWorkflowReferenceVisible = (
	providerIndex?: string,
	consumerIndex?: string,
) => {
	if (!providerIndex || !consumerIndex) return false;
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
