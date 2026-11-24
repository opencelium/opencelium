import type { MethodWithId } from '../../../types/connection';

export type ReferenceKind = 'step' | 'webhook' | 'global';

export type ReferenceDescription = { kind: ReferenceKind; color: string; source: string; path: string; token: string };

export type ReferenceSourceLabels = Record<Exclude<ReferenceKind, 'step'>, string>;

const STEP_RE = /^\{%\s*(#[0-9a-fA-F]{6})\.(.*?)\s*%\}$/;
const WEBHOOK_RE = /^\$\{([^}:]+)(?::[a-z]+)?\}$/;
const GLOBAL_RE = /^\{\{\s*global\.(.+?)\s*\}\}$/;

// Not step colours: these two kinds come from outside the workflow, so they take theme accents.
const KIND_COLOR: ReferenceSourceLabels = {
	webhook: 'var(--color-status-warning-fg)',
	global: 'var(--color-action-primary)',
};

/** `(response).body.$.customer.name` → `customer.name`; status, headers and request parts keep their prefix. */
const shortenPath = (path: string) => path
	.replace(/^\(response\)\.body\.\$\.?/, '')
	.replace(/^\(response\)\./, '')
	.replace(/^\(request\)\./, 'request.') || '$';

/** How a reference token reads as a chip: where it comes from, and the path inside it. */
export const describeReference = (
	token: string,
	methods: MethodWithId[],
	labels: ReferenceSourceLabels,
): ReferenceDescription => {
	const step = STEP_RE.exec(token);
	if (step) {
		const method = methods.find((item) => item.color?.toLowerCase() === step[1].toLowerCase());
		return { kind: 'step', color: step[1], source: method?.label || method?.name || step[1], path: shortenPath(step[2]), token };
	}
	const webhook = WEBHOOK_RE.exec(token);
	if (webhook) return { kind: 'webhook', color: KIND_COLOR.webhook, source: labels.webhook, path: webhook[1], token };
	const global = GLOBAL_RE.exec(token);
	return { kind: 'global', color: KIND_COLOR.global, source: labels.global, path: global?.[1] ?? token, token };
};
