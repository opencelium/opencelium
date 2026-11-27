import { describe, expect, it } from 'vitest';
import { mergeGraphQlFields, toEditorVariables } from './graphQlBodyFields';

const invokerFields = {
	query: 'query ListCountries($code: ID!) { continent(code: $code) { name } }',
	operationName: 'ListCountries',
	variables: { code: 'AN' },
};

describe('toEditorVariables', () => {
	it('shows saved variables as JSON', () => {
		expect(toEditorVariables(invokerFields)).toBe('{\n  "code": "AN"\n}');
	});

	it('shows nothing without variables', () => {
		expect(toEditorVariables({ query: '{ a }' })).toBeUndefined();
		expect(toEditorVariables(undefined)).toBeUndefined();
	});
});

describe('mergeGraphQlFields', () => {
	it('keeps the variables when only the query is edited', () => {
		const next = mergeGraphQlFields(invokerFields, {
			query: 'query ListCountries($code: ID!) { continent(code: $code) { code name } }',
			variables: '{\n  "code": "AN"\n}',
			operationName: 'ListCountries',
		});

		expect(next).toEqual({
			query: 'query ListCountries($code: ID!) { continent(code: $code) { code name } }',
			operationName: 'ListCountries',
			variables: { code: 'AN' },
		});
	});

	it('saves edited variables', () => {
		const next = mergeGraphQlFields(invokerFields, { query: invokerFields.query, variables: '{"code":"EU"}', operationName: 'ListCountries' });

		expect(next.variables).toEqual({ code: 'EU' });
	});

	it('keeps the last saved variables while the JSON is still being typed', () => {
		const next = mergeGraphQlFields(invokerFields, { query: invokerFields.query, variables: '{"code": "E', operationName: 'ListCountries' });

		expect(next.variables).toEqual({ code: 'AN' });
	});

	it('drops variables cleared in the editor and the operation name of an anonymous query', () => {
		const next = mergeGraphQlFields(invokerFields, { query: '{ continents { code } }', variables: '  ', operationName: null });

		expect(next).toEqual({ query: '{ continents { code } }' });
	});

	it('keeps fields the editor does not own', () => {
		const next = mergeGraphQlFields({ ...invokerFields, extensions: { persisted: true } }, {
			query: invokerFields.query, variables: null, operationName: 'ListCountries',
		});

		expect(next.extensions).toEqual({ persisted: true });
	});
});
