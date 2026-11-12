export type ReferenceErrorCode =
	| 'REFERENCE_REQUIRED'
	| 'SURROUNDING_WHITESPACE'
	| 'UNKNOWN_REFERENCE'
	| 'INVALID_REFERENCE'
	| 'UNCLOSED_WRAPPER'
	| 'INVALID_COLOR'
	| 'INVALID_EXCHANGE_TYPE'
	| 'PART_REQUIRED'
	| 'INVALID_PART'
	| 'STATUS_HAS_PATH'
	| 'MISSING_ROOT'
	| 'MISSING_DOT_AFTER_ROOT'
	| 'PATH_REQUIRED'
	| 'TRAILING_DOT'
	| 'UNCLOSED_BRACKET'
	| 'UNEXPECTED_CLOSING_BRACKET'
	| 'UNCLOSED_QUOTE'
	| 'QUOTE_OUTSIDE_BRACKETS'
	| 'EMPTY_FIELD_NAME'
	| 'INVALID_BRACKET_CONTENT'
	| 'INVALID_FILTER'
	| 'UNKNOWN_ITERATOR'
	| 'MISSING_DOT'
	| 'INVALID_TILDE'
	| 'TILDE_NOT_LAST'
	| 'INVALID_JSON_PATH'
	| 'HEADER_NAME_REQUIRED'
	| 'INVALID_HEADER_NAME'
	| 'INVALID_HEADER_SELECTOR'
	| 'UNKNOWN_DATA_TYPE';

export type ReferenceSyntaxWarningCode =
	| 'DEEP_SCAN'
	| 'DUPLICATE_ROOT'
	| 'EMPTY_BRACKETS'
	| 'FIELD_WHITESPACE'
	| 'UNEXPECTED_PATH_AFTER_ALL';

export type ReferenceSampleWarningCode =
	| 'PATH_NOT_IN_SAMPLE'
	| 'FIELD_ON_ARRAY'
	| 'NOT_AN_ARRAY'
	| 'INDEX_OUT_OF_RANGE'
	| 'EMPTY_ARRAY_IN_SAMPLE'
	| 'NO_MATCH_IN_SAMPLE'
	| 'INVALID_SAMPLE';

export type ReferenceIssueCode = ReferenceErrorCode | ReferenceSyntaxWarningCode | ReferenceSampleWarningCode;

export type ReferenceType = 'DIRECT' | 'WRAPPED_DIRECT' | 'WEBHOOK' | 'ENHANCEMENT' | 'PAGE' | 'REQUEST_DATA';

export type ReferencePart = 'BODY' | 'HEADER' | 'STATUS' | 'ALL';

export type ReferenceIssue = {
	/** A string, not the union: the backend may add codes before the frontend knows them. */
	code: string;
	message: string;
	hint: string | null;
	/** 0-based index into the validated reference; null when the issue is about the whole reference. */
	position: number | null;
	fragment: string | null;
};

export type ReferenceValidationRequest = {
	reference: string;
	/** null: iterators are not checked. []: the reference is outside every loop. */
	iterators: string[] | null;
	sample?: unknown;
};

export type ReferenceValidationResult = {
	valid: boolean;
	reference: string;
	type: ReferenceType | null;
	part: ReferencePart | null;
	path: string | null;
	sampleMatched: boolean | null;
	errors: ReferenceIssue[];
	warnings: ReferenceIssue[];
};
