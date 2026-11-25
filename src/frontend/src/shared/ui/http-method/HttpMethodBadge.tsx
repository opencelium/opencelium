import type { CSSProperties } from 'react';

type ColoredHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

const METHOD_COLORS: Record<ColoredHttpMethod, string> = {
	GET: 'var(--color-status-info-fg)',
	POST: 'var(--color-status-success-fg)',
	PUT: 'var(--color-status-warning-fg)',
	DELETE: 'var(--color-status-error-fg)',
	PATCH: 'var(--color-action-secondary)',
};

const isColoredHttpMethod = (method: string): method is ColoredHttpMethod => method in METHOD_COLORS;

// Inline rather than a class: hosts such as the workflow sidebar style every nested
// `span` of their rows, and a plain class selector would lose to those rules.
// The min-width fits DELETE, so names next to the badge line up in a list.
const badgeStyle: CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	minWidth: 60,
	height: 20,
	padding: '0 8px',
	borderRadius: 4,
	fontSize: 12,
	fontWeight: 600,
	color: 'var(--color-text-on-action)',
	lineHeight: 1,
	whiteSpace: 'nowrap',
};

export function HttpMethodBadge({ method }: { method: string }) {
	const normalized = method.toUpperCase();
	const backgroundColor = isColoredHttpMethod(normalized)
		? METHOD_COLORS[normalized]
		: 'var(--color-text-secondary)';
	return <span style={{ ...badgeStyle, backgroundColor }}>{normalized}</span>;
}
