export type GraphQlBodyFields = Record<string, unknown>;

/** What the active GraphiQL tab holds; the saved body follows it. */
export type GraphQlTabContent = {
	query: string;
	variables: string | null | undefined;
	operationName: string | null;
};

/** The saved `variables` as the Variables editor shows them, or undefined when there are none. */
export const toEditorVariables = (fields: GraphQlBodyFields | undefined): string | undefined => {
	const variables = fields?.variables;
	if (variables === undefined || variables === null) return undefined;
	return typeof variables === 'string' ? variables : JSON.stringify(variables, null, 2);
};

const parseVariables = (text: string): { ok: true; value: unknown } | { ok: false } => {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false };
	}
};

/**
 * The body fields after an edit in the editor. Fields the editor doesn't own (from the invoker,
 * e.g. `extensions`) are kept. Variables that don't parse yet, while being typed, keep the last
 * saved value instead of dropping it.
 */
export const mergeGraphQlFields = (fields: GraphQlBodyFields | undefined, tab: GraphQlTabContent): GraphQlBodyFields => {
	const next: GraphQlBodyFields = { ...fields, query: tab.query };
	delete next.variables;
	delete next.operationName;

	const variablesText = tab.variables?.trim() ?? '';
	if (variablesText) {
		const parsed = parseVariables(variablesText);
		if (parsed.ok) next.variables = parsed.value;
		else if (fields?.variables !== undefined) next.variables = fields.variables;
	}
	if (tab.operationName) next.operationName = tab.operationName;
	return next;
};
