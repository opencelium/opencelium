import { parseReferenceDisplay } from '../request-editor/shared/referenceDisplay';

/** Webhook and global references come from outside the workflow, so they take theme accents, not step colours. */
export const WEBHOOK_CHIP_COLOR = 'var(--color-status-warning-fg)';
export const GLOBAL_CHIP_COLOR = 'var(--color-action-primary)';

const STEP_COLOR_RE = /^\{?%?\s*#?([0-9a-fA-F]{6})\./;

/** `#c77e7e.(response)…` (wrapped or not) → `#c77e7e`; null when the text is not a step reference. */
export const readStepReferenceColor = (reference: string): string | null => {
	const match = STEP_COLOR_RE.exec(reference.trim());
	return match ? `#${match[1]}` : null;
};

/**
 * The path part of a step reference chip: `(response).body.$.customer.name` → `customer.name`,
 * the body root → `$`; header and status keep their prefix so they never read as a body field.
 */
export const formatStepReferencePath = (reference: string): string => {
	const unwrapped = reference.trim().replace(/^\{%\s*/, '').replace(/\s*%\}$/, '');
	const parsed = parseReferenceDisplay(unwrapped);
	if (!parsed) return unwrapped;
	switch (parsed.messageProperty) {
		case 'status': return 'status';
		case 'header': return parsed.path ? `header.${parsed.path}` : 'header';
		case 'body': return parsed.path || '$';
		default: {
			const _exhaustive: never = parsed.messageProperty;
			return _exhaustive;
		}
	}
};
