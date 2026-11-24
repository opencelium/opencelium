import { isGlobalReference, parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { extractWebhookValue } from '../request-editor/body-editor/bodyWebhook';
import { formatStepReferencePath, GLOBAL_CHIP_COLOR, readStepReferenceColor, WEBHOOK_CHIP_COLOR } from './referenceChip.utils';
import type { ReferenceSourceLabels } from './ReferenceSourceContext';

export type ReferenceChipContent = { color: string; source?: string; path: string };

const WEBHOOK_RE = /^\$\{[^}]+\}$/;

/** Chip content for any reference a request field can hold: a step reference, a webhook parameter or a global. */
export const describeWorkflowReference = (reference: string, labels: ReferenceSourceLabels): ReferenceChipContent => {
	const value = reference.trim();
	if (isGlobalReference(value)) {
		return { color: GLOBAL_CHIP_COLOR, source: labels.global, path: parseGlobalReference(value)?.name ?? value };
	}
	if (WEBHOOK_RE.test(value)) {
		return { color: WEBHOOK_CHIP_COLOR, source: labels.webhook, path: extractWebhookValue(value).split(':')[0] };
	}
	const color = readStepReferenceColor(value);
	return { color: color ?? 'var(--color-text-disabled)', source: color ? labels.methodLabel(color) : undefined,
		path: formatStepReferencePath(value) };
};
