/**
 * Wire contract for the field-binding suggester.
 *
 * The payload is schema metadata only — field paths and their scalar kind. No request
 * bodies, no captured responses, no customer data ever leaves the browser through here,
 * which is what makes this endpoint safe to answer with a hosted model on an on-prem
 * install. Keep it that way: anything carrying real values belongs in a different call.
 */

export type SchemaFieldKind = 'string' | 'number' | 'boolean' | 'unknown';

export type SchemaField = {
	/** Reference-grammar path relative to the message root, e.g. `$.items[0].sku`. */
	path: string;
	kind: SchemaFieldKind;
};

/** One method whose response can feed the target — identified by its workflow colour. */
export type SuggestionSource = {
	color: string;
	label: string;
	connectorTitle: string;
	fields: SchemaField[];
};

export type SuggestionTarget = {
	label: string;
	connectorTitle: string;
	fields: SchemaField[];
};

export type FieldBindingSuggestionRequest = {
	target: SuggestionTarget;
	sources: SuggestionSource[];
};

/**
 * Which tier produced a suggestion. `precedent` is a mapping this pair of connectors has
 * been given before, `deterministic` a name/type match, `model` a semantic proposal.
 * The UI sorts and labels by this, so a user can tell a recalled fact from a guess.
 */
export type SuggestionOrigin = 'precedent' | 'deterministic' | 'model';

export type FieldBindingSuggestion = {
	id: string;
	targetPath: string;
	sourceColor: string;
	sourcePath: string;
	/** 0..1, shown on the row so the user can weigh a proposal before accepting it. */
	confidence: number;
	origin: SuggestionOrigin;
	rationale?: string;
};

export type FieldBindingSuggestionResponse = {
	suggestions: FieldBindingSuggestion[];
};
