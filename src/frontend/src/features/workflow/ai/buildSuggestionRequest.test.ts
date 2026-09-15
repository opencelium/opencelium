import { describe, expect, it } from 'vitest';
import { suggestFieldBindings } from '@/mock/ai/suggestFieldBindings';
import { buildReferenceValue } from '../components/request-editor/body-editor/requestReferenceOptions';
import { parseReference } from '../components/request-editor/body-editor/bodyReference';
import { MethodType, type Connection, type MethodWithId } from '../types/connection';
import { buildSuggestionRequest, buildTargetPathIndex } from './buildSuggestionRequest';

const method = (over: {
	id: string; index: string; color: string; name: string;
	requestFields?: unknown; responseFields?: unknown;
}): MethodWithId => ({
	id: over.id,
	index: over.index,
	color: over.color,
	name: over.name,
	methodType: MethodType.Connector,
	connector: { connectorId: 1, title: 'Jira', icon: null },
	request: {
		requestId: `${over.id}-req`, endpoint: '', method: 'POST', header: {},
		body: { type: 'object', format: 'json', data: 'raw', fields: over.requestFields ?? {} },
	},
	response: {
		responseId: `${over.id}-res`,
		success: { status: '200', header: {},
			body: { type: 'object', format: 'json', data: 'raw', fields: over.responseFields ?? {} } },
		fail: { status: '400', header: {},
			body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	},
} as MethodWithId);

const connectionOf = (methods: MethodWithId[], operators: unknown[] = []): Connection => ({
	connectionId: 1, name: 'c', description: '', fieldBindings: [],
	fromConnector: { connectorId: 1, title: 'Jira', method: methods, operator: operators },
	toConnector: null,
	ui: {},
} as unknown as Connection);

describe('buildSuggestionRequest', () => {
	const reader = method({
		id: 'a', index: '0', color: '#aabbcc', name: 'get ticket',
		responseFields: { ticket: { summary: '', reporterMail: '', priority: 0 } },
	});
	const writer = method({
		id: 'b', index: '1', color: '#ddeeff', name: 'create issue',
		requestFields: { issue: { subject: '', email: '', severity: 0 } },
	});
	const connection = connectionOf([reader, writer]);

	it('offers the target leaves and every upstream method response as sources', () => {
		const payload = buildSuggestionRequest(connection, writer, buildTargetPathIndex(writer));

		expect(payload.target.fields.map((item) => item.path))
			.toEqual(['$.issue.subject', '$.issue.email', '$.issue.severity']);
		expect(payload.sources).toHaveLength(1);
		expect(payload.sources[0].color).toBe('#aabbcc');
	});

	it('never offers the method its own response as a source', () => {
		const payload = buildSuggestionRequest(connection, reader, buildTargetPathIndex(reader));

		expect(payload.sources).toHaveLength(0);
	});

	it('carries only schema metadata — no values from the request body', () => {
		const withValues = method({
			id: 'c', index: '1', color: '#010203', name: 'send',
			requestFields: { token: 'super-secret-value' },
		});
		const payload = buildSuggestionRequest(
			connectionOf([reader, withValues]), withValues, buildTargetPathIndex(withValues));

		expect(JSON.stringify(payload)).not.toContain('super-secret-value');
	});

	it('round-trips through the suggester into references the reference parser accepts', () => {
		const targetPaths = buildTargetPathIndex(writer);
		const suggestions = suggestFieldBindings(
			buildSuggestionRequest(connection, writer, targetPaths));

		expect(suggestions.map((item) => item.targetPath).sort())
			.toEqual(['$.issue.email', '$.issue.severity', '$.issue.subject']);

		suggestions.forEach((suggestion) => {
			expect(targetPaths.has(suggestion.targetPath)).toBe(true);
			const reference = buildReferenceValue(suggestion.sourceColor, 'body', suggestion.sourcePath);
			expect(parseReference(reference)).toMatchObject({
				color: suggestion.sourceColor, type: 'response',
			});
		});
	});
});

describe('buildSuggestionRequest — inside a loop', () => {
	const reader = method({
		id: 'a', index: '0', color: '#aabbcc', name: 'GetAllUser',
		responseFields: { users: [{ name: '', email: '' }], total: 0 },
	});
	const writer = method({
		id: 'b', index: '1_0', color: '#ddeeff', name: 'AddUser',
		requestFields: { name: '', email: '' },
	});
	const loopOver = (path: string) => ([{
		id: 'op-1', index: '1', type: 'loop', iterator: 'i',
		expression: `{%#AABBCC.(response).body.${path}%}`,
	}]);

	/**
	 * The method runs once per element, so a reference into the collection being walked has
	 * to read the current iteration. `[0]` would compile and write the first user every time.
	 */
	it('references the iterated collection through the loop iterator, not [0]', () => {
		const payload = buildSuggestionRequest(
			connectionOf([reader, writer], loopOver('$.users')), writer, buildTargetPathIndex(writer));

		expect(payload.sources[0].fields.map((field) => field.path))
			.toEqual(['$.users[i].name', '$.users[i].email', '$.total']);
	});

	it('leaves arrays the loop does not walk on their first element', () => {
		const payload = buildSuggestionRequest(
			connectionOf([reader, writer], loopOver('$.groups')), writer, buildTargetPathIndex(writer));

		expect(payload.sources[0].fields.map((field) => field.path))
			.toEqual(['$.users[0].name', '$.users[0].email', '$.total']);
	});

	it('still reads the first element when the method is in no loop', () => {
		const outside = method({
			id: 'c', index: '1', color: '#ddeeff', name: 'AddUser',
			requestFields: { name: '' },
		});
		const payload = buildSuggestionRequest(
			connectionOf([reader, outside], loopOver('$.users')), outside, buildTargetPathIndex(outside));

		expect(payload.sources[0].fields.map((field) => field.path))
			.toEqual(['$.users[0].name', '$.users[0].email', '$.total']);
	});

	it('produces a reference the parser accepts', () => {
		const payload = buildSuggestionRequest(
			connectionOf([reader, writer], loopOver('$.users')), writer, buildTargetPathIndex(writer));

		expect(parseReference(buildReferenceValue('#aabbcc', 'body', payload.sources[0].fields[0].path)))
			.toMatchObject({ color: '#aabbcc', type: 'response', field: 'body.$.users[i].name' });
	});
});
