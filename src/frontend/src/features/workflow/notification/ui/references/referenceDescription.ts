import type { MethodWithId } from '../../../types/connection';

export type ReferenceDescription = { color: string; methodLabel: string; path: string; token: string };

/** `(response).body.$.customer.name` → `customer.name`; status, headers and request parts keep their prefix. */
const shortenPath = (path: string) => path
	.replace(/^\(response\)\.body\.\$\.?/, '')
	.replace(/^\(response\)\./, '')
	.replace(/^\(request\)\./, 'request.') || '$';

export const describeReference = (reference: string, methods: MethodWithId[]): ReferenceDescription => {
	const color = reference.slice(0, 7);
	const method = methods.find((item) => item.color?.toLowerCase() === color.toLowerCase());
	return {
		color,
		methodLabel: method?.label || method?.name || color,
		path: shortenPath(reference.slice(8)),
		token: `{%${reference}%}`,
	};
};
