import { describe, expect, it } from 'vitest';
import type { ReferenceIssue, ReferenceValidationResult } from '../../../types/referenceValidation.types';
import { toReferencePathFeedback } from './referenceValidation.utils';

const t = (key: string, values?: Record<string, unknown>) =>
	key === 'references.issues.UNKNOWN_FUTURE_CODE' ? String(values?.defaultValue) : `${key}|${values?.fragment}`;

const issue = (code: string, extra: Partial<ReferenceIssue> = {}): ReferenceIssue =>
	({ code, message: `${code} message`, hint: `${code} hint`, position: 26, fragment: 'dat', ...extra });

const result = (errors: ReferenceIssue[], warnings: ReferenceIssue[] = []): ReferenceValidationResult => ({
	valid: errors.length === 0, reference: '#ababab.(response).body.$.dat', type: 'DIRECT', part: 'BODY',
	path: 'dat', sampleMatched: null, errors, warnings,
});

describe('toReferencePathFeedback', () => {
	it('returns nothing for a clean reference', () => {
		expect(toReferencePathFeedback(result([]), t)).toBeNull();
	});

	it('reports the first error, translated by code, with the backend hint', () => {
		expect(toReferencePathFeedback(result([issue('UNCLOSED_BRACKET'), issue('TRAILING_DOT')],
			[issue('DEEP_SCAN')]), t)).toEqual({
			severity: 'error', message: 'references.issues.UNCLOSED_BRACKET|dat', hint: 'UNCLOSED_BRACKET hint',
		});
	});

	it('reports a warning when there is no error', () => {
		expect(toReferencePathFeedback(result([], [issue('PATH_NOT_IN_SAMPLE', { hint: null })]), t))
			.toEqual({ severity: 'warning', message: 'references.issues.PATH_NOT_IN_SAMPLE|dat', hint: null });
	});

	it('skips sample findings that only describe the declared example', () => {
		expect(toReferencePathFeedback(result([], [issue('INDEX_OUT_OF_RANGE'), issue('EMPTY_ARRAY_IN_SAMPLE'),
			issue('NO_MATCH_IN_SAMPLE'), issue('INVALID_SAMPLE')]), t)).toBeNull();
		expect(toReferencePathFeedback(result([], [issue('INDEX_OUT_OF_RANGE'), issue('FIELD_ON_ARRAY')]), t))
			.toMatchObject({ message: 'references.issues.FIELD_ON_ARRAY|dat' });
	});

	it("falls back to the backend's message for a code it does not know", () => {
		expect(toReferencePathFeedback(result([issue('UNKNOWN_FUTURE_CODE')]), t))
			.toMatchObject({ message: 'UNKNOWN_FUTURE_CODE message' });
	});
});
