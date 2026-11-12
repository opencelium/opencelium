import type {
	ReferenceIssue,
	ReferenceSampleWarningCode,
	ReferenceValidationResult,
} from '../../../types/referenceValidation.types';

export type ReferencePathFeedback = { severity: 'error' | 'warning'; message: string; hint: string | null };

type FeedbackT = (key: string, values?: Record<string, unknown>) => string;

// The sample sent is the declared response: one example item with placeholder
// values. These findings describe that declaration, not the path.
const DECLARATION_NOISE: ReadonlySet<string> = new Set<ReferenceSampleWarningCode>([
	'INDEX_OUT_OF_RANGE', 'EMPTY_ARRAY_IN_SAMPLE', 'NO_MATCH_IN_SAMPLE', 'INVALID_SAMPLE',
]);

const describeIssue = (severity: ReferencePathFeedback['severity'], issue: ReferenceIssue,
	t: FeedbackT): ReferencePathFeedback => ({
	severity,
	// A code the frontend does not know yet falls back to the backend's English text.
	message: t(`references.issues.${issue.code}`, { fragment: issue.fragment ?? '', defaultValue: issue.message }),
	hint: issue.hint,
});

export const toReferencePathFeedback = (result: ReferenceValidationResult,
	t: FeedbackT): ReferencePathFeedback | null => {
	const [error] = result.errors;
	if (error) return describeIssue('error', error, t);
	const warning = result.warnings.find((issue) => !DECLARATION_NOISE.has(issue.code));
	return warning ? describeIssue('warning', warning, t) : null;
};
