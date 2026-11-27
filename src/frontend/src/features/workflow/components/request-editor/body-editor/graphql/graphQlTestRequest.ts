import { parse, type OperationDefinitionNode } from 'graphql';
import type { FetcherParams } from '@graphiql/toolkit';
import { serializeHeaderReferences, serializeReferenceString } from '../../../../api/connectionPayload.references';
import type { MethodTestRequest, MethodTestResult } from '../../../../request-playground/model/playground.types';
import type { MethodWithId } from '../../../../types/connection';

export type GraphQlResult = {
	data?: unknown;
	errors?: { message: string }[];
};

/**
 * The method as POST /connection/method/test takes it, carrying GraphiQL's operation as its body.
 * The backend reads the connector and fills its credentials into the endpoint and headers itself,
 * so they never reach the browser. `raw`, not `graphql`: the latter joins the query's lines, which
 * turns everything after a `#` comment into comment.
 *
 * GraphQL sends every operation, the schema load included, as POST, which the method test only
 * sends with confirmWrite. So it is always set here; a mutation is confirmed by the user first.
 */
export const buildGraphQlTestRequest = (method: MethodWithId, params: FetcherParams): MethodTestRequest => {
	const endpointArgs = method.request.endpointArgs ?? {};
	return {
		method: {
			id: method.id,
			name: method.name,
			index: method.index,
			methodType: method.methodType,
			dataAggregator: null,
			color: method.color,
			connector: method.connector
				? { connectorId: method.connector.connectorId, title: method.connector.title, icon: method.connector.icon ?? null, invoker: null }
				: null,
			request: {
				endpoint: serializeReferenceString(method.request.endpoint ?? '', endpointArgs),
				method: 'POST',
				header: serializeHeaderReferences(method.request.header ?? {}, endpointArgs),
				body: {
					type: 'object',
					format: 'json',
					data: 'raw',
					fields: {
						query: params.query,
						...(params.variables ? { variables: params.variables } : {}),
						...(params.operationName ? { operationName: params.operationName } : {}),
					},
				},
			},
			response: method.response,
		},
		staticValues: {},
		confirmWrite: true,
	};
};

/** Whether the operation GraphiQL runs would change data: a mutation, as opposed to a query or the schema load. */
export const isGraphQlMutation = ({ query, operationName }: FetcherParams): boolean => {
	try {
		const operations = parse(query).definitions
			.filter((definition): definition is OperationDefinitionNode => definition.kind === 'OperationDefinition');
		const running = operationName ? operations.find((operation) => operation.name?.value === operationName) : operations[0];
		return running?.operation === 'mutation';
	} catch {
		// GraphiQL reports a query that does not parse itself; nothing would change data.
		return false;
	}
};

const readBody = (body: unknown): unknown => {
	if (typeof body !== 'string') return body;
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
};

/** What GraphiQL shows for a test: the remote answer as it came, or why there is none. */
export const toGraphQlResult = (result: MethodTestResult): GraphQlResult => {
	if (result.connectorErrors.length) return { errors: result.connectorErrors.map(({ message }) => ({ message })) };
	if (!result.response) return { errors: [{ message: 'No response' }] };
	const body = readBody(result.response.body);
	if (body && typeof body === 'object') return body as GraphQlResult;
	return { errors: [{ message: `HTTP ${result.response.status}${typeof body === 'string' && body ? `: ${body}` : ''}` }] };
};
