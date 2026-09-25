export const ENDPOINT_REFERENCE_CLASS = 'oc-endpoint-ref';

export const getCaretFromRawChange = (previous: string, next: string) => {
	let prefix = 0;
	while (prefix < previous.length && prefix < next.length
		&& previous[prefix] === next[prefix]) prefix += 1;

	let suffix = 0;
	while (suffix < previous.length - prefix && suffix < next.length - prefix
		&& previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]) suffix += 1;

	return next.length - suffix;
};
