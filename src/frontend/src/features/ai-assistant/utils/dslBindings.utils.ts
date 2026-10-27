/** One end of a field binding, as the backend stores it (`#C77E7E`, `response`, `body.$.issues[i].key`). */
export type BindingEndpoint = { color: string; type: 'request' | 'response'; field: string };

/** The saved shape `normalizeWorkflowFieldBindings` reads, as in a stored connection or template. */
export type GeneratedFieldBinding = {
	nodeId: null;
	from: BindingEndpoint[];
	to: [BindingEndpoint];
	enhancement: {
		enhanceId: null;
		name: string;
		description: string;
		language: 'js';
		expertCode: string;
		expertVar: string;
		simpleCode: null;
	};
};

const REFERENCE_RE = /^(#[0-9A-Fa-f]{6})\.\((request|response)\)\.(.+)$/;

function toEndpoint(reference: string): BindingEndpoint {
	const match = REFERENCE_RE.exec(reference);
	if (!match?.[1] || !match[3]) throw new Error(`Not a method reference: ${reference}`);
	return { color: match[1], type: match[2] === 'request' ? 'request' : 'response', field: match[3] };
}

const describeEndpoint = (endpoint: BindingEndpoint) => `${endpoint.color}.(${endpoint.type}).${endpoint.field}`;

/**
 * A transformation on a request body field. `inputs` are resolved references (VAR_0, VAR_1, …); the field itself
 * holds them joined with ";", which is how the editor shows a field fed by a script.
 */
export function buildFieldBinding(targetColor: string, fieldName: string, inputs: string[], code: string,
	description: string): { binding: GeneratedFieldBinding; bodyValue: string } {
	const from = inputs.map(toEndpoint);
	const to: BindingEndpoint = { color: targetColor, type: 'request', field: `body.$.${fieldName}` };
	const expertVar = [
		`//var RESULT_VAR = ${describeEndpoint(to)};`,
		...from.map((endpoint, index) => `//var VAR_${index} = ${describeEndpoint(endpoint)};`),
	].join('\n');
	return {
		bodyValue: inputs.join(';'),
		binding: {
			nodeId: null, from, to: [to],
			enhancement: {
				enhanceId: null, name: '', description, language: 'js',
				expertCode: code.trim().endsWith(';') || code.trim().endsWith('}') ? code : `${code};`,
				expertVar, simpleCode: null,
			},
		},
	};
}
