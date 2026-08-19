import type { Connection, MethodWithId } from '../../types/connection';

const updateMethod = (
	connection: Connection,
	methodId: string,
	update: (method: MethodWithId) => MethodWithId,
): Connection => {
	const index = connection.fromConnector.method.findIndex((method) => method.id === methodId);
	if (index === -1) return connection;
	const methods = connection.fromConnector.method.slice();
	methods[index] = update(methods[index]);
	return {
		...connection,
		fromConnector: { ...connection.fromConnector, method: methods },
	};
};

const updateRequest = (
	connection: Connection,
	methodId: string,
	patch: Partial<MethodWithId['request']>,
) => updateMethod(connection, methodId, (method) => ({
	...method,
	request: { ...method.request, ...patch },
}));

export const updateMethodPayload = (
	connection: Connection,
	methodId: string,
	newFields: any,
	property: 'body' | 'header',
) => property === 'body'
	? updateMethod(connection, methodId, (method) => ({
		...method,
		request: { ...method.request,
			body: { ...method.request.body, fields: newFields } },
	}))
	: updateRequest(connection, methodId, { header: newFields });

export const updateMethodEndpoint = (
	connection: Connection,
	methodId: string,
	endpoint: string,
) => updateRequest(connection, methodId, { endpoint });

export const updateMethodHttpMethod = (
	connection: Connection,
	methodId: string,
	method: string,
) => updateRequest(connection, methodId, { method });

export const updateMethodQueryParams = (
	connection: Connection,
	methodId: string,
	queryParams: any[],
) => updateRequest(connection, methodId, { queryParams: queryParams || [] });

export const upsertMethodEndpointArg = (
	connection: Connection,
	methodId: string,
	argId: string,
	patch: any,
) => updateMethod(connection, methodId, (method) => {
	const current = method.request.endpointArgs || {};
	return { ...method, request: { ...method.request, endpointArgs: {
		...current,
		[argId]: { ...(current[argId] || { id: argId }), ...patch, id: argId },
	} } };
});

export const removeMethodEndpointArg = (
	connection: Connection,
	methodId: string,
	argId: string,
) => updateMethod(connection, methodId, (method) => {
	const current = method.request.endpointArgs || {};
	if (!current[argId]) return method;
	const endpointArgs = { ...current };
	delete endpointArgs[argId];
	return { ...method, request: { ...method.request, endpointArgs } };
});
