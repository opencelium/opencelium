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

const connectionOf = (methods: MethodWithId[]): Connection => ({
	connectionId: 1, name: 'c', description: '', fieldBindings: [],
	fromConnector: { connectorId: 1, title: 'Jira', method: methods, operator: [] },
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
