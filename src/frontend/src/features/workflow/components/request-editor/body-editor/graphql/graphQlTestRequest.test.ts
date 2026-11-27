import { describe, expect, it } from 'vitest';
import type { MethodWithId } from '../../../../types/connection';
import { MethodType } from '../../../../types/connection';
import { buildGraphQlTestRequest, isGraphQlMutation, toGraphQlResult } from './graphQlTestRequest';

const method = {
	id: 'node-1',
	index: '0',
	name: 'Query',
	color: '#C77E7E',
	methodType: MethodType.Connector,
	connector: { connectorId: 7, title: 'Lansweeper', icon: null },
	request: {
		requestId: 'request-node-1',
		endpoint: '{url}',
		method: 'POST',
		header: { Authorization: 'Token {token}', 'Content-Type': 'application/json' },
		body: { type: 'object', format: 'json', data: 'graphql', fields: { query: 'saved' } },
	},
	response: {
		responseId: 'response-node-1',
		success: { status: '200', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
		fail: { status: '500', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	},
} as unknown as MethodWithId;

describe('GraphQL editor requests through the method test', () => {
	it('sends the method with its connector placeholders and GraphiQL operation, never a credential', () => {
		const request = buildGraphQlTestRequest(method, { query: '# list\n{ me { id } }', operationName: 'Me', variables: { a: 1 } });
		// Every GraphQL operation is a POST, which the method test refuses without it.
		expect(request.confirmWrite).toBe(true);
		expect(request.staticValues).toEqual({});
		expect(request.method.connector).toMatchObject({ connectorId: 7 });
		expect(request.method.request).toEqual({
			endpoint: '{url}',
			method: 'POST',
			header: { Authorization: 'Token {token}', 'Content-Type': 'application/json' },
			body: { type: 'object', format: 'json', data: 'raw',
				fields: { query: '# list\n{ me { id } }', variables: { a: 1 }, operationName: 'Me' } },
		});
	});

	it('leaves out what GraphiQL did not send', () => {
		expect(buildGraphQlTestRequest(method, { query: '{ me { id } }' }).method.request.body)
			.toEqual(expect.objectContaining({ fields: { query: '{ me { id } }' } }));
	});

	it('knows a mutation from a query and from the schema load', () => {
		expect(isGraphQlMutation({ query: 'mutation Add { add(id: 1) { id } }' })).toBe(true);
		expect(isGraphQlMutation({ query: 'query Q { a } mutation M { b }', operationName: 'Q' })).toBe(false);
		expect(isGraphQlMutation({ query: 'query Q { a } mutation M { b }', operationName: 'M' })).toBe(true);
		expect(isGraphQlMutation({ query: 'query IntrospectionQuery { __schema { types { name } } }' })).toBe(false);
		expect(isGraphQlMutation({ query: 'not graphql {' })).toBe(false);
	});

	it('hands GraphiQL the remote answer, or says why there is none', () => {
		const sent = (body: unknown, status = 200) => toGraphQlResult({ request: null, durationMs: 5, connectorErrors: [],
			response: { status, headers: {}, body } });
		expect(sent({ data: { me: { id: 1 } } })).toEqual({ data: { me: { id: 1 } } });
		expect(sent('{"errors":[{"message":"denied"}]}', 401)).toEqual({ errors: [{ message: 'denied' }] });
		expect(sent('Bad gateway', 502)).toEqual({ errors: [{ message: 'HTTP 502: Bad gateway' }] });
		expect(toGraphQlResult({ request: null, response: null, durationMs: null,
			connectorErrors: [{ connectorId: 7, message: 'Login failed' }] })).toEqual({ errors: [{ message: 'Login failed' }] });
	});
});
