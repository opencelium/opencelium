import type {
	Connection,
	Enhancement,
	MethodWithId,
	OperatorWithId,
} from '../../types/connection';

export const addConnectionMethod = (connection: Connection, method: MethodWithId) => ({
	...connection,
	fromConnector: {
		...connection.fromConnector,
		method: [...connection.fromConnector.method, method],
	},
});

export const removeConnectionMethod = (connection: Connection, methodIndex: string) => ({
	...connection,
	fromConnector: {
		...connection.fromConnector,
		method: connection.fromConnector.method.filter((method) => method.index !== methodIndex),
	},
});

export const addConnectionOperator = (connection: Connection, operator: OperatorWithId) => ({
	...connection,
	fromConnector: {
		...connection.fromConnector,
		operator: [...connection.fromConnector.operator, operator],
	},
});

export const removeConnectionOperator = (connection: Connection, operatorIndex: string) => ({
	...connection,
	fromConnector: {
		...connection.fromConnector,
		operator: connection.fromConnector.operator.filter((operator) =>
			operator.index !== operatorIndex),
	},
});

export const upsertConnectionFieldBinding = (
	connection: Connection,
	enhancement: Enhancement,
) => {
	if (!enhancement?.enhanceId) return connection;
	const bindings = connection.fieldBindings || [];
	const index = bindings.findIndex((binding) =>
		binding?.enhancement?.enhanceId === enhancement.enhanceId);
	const next = bindings.slice();
	if (index === -1) next.push({ enhancement });
	else next[index] = { enhancement };
	return { ...connection, fieldBindings: next };
};

export const removeConnectionFieldBinding = (
	connection: Connection,
	enhanceId: string,
) => ({
	...connection,
	fieldBindings: (connection.fieldBindings || []).filter((binding) =>
		binding?.enhancement?.enhanceId !== enhanceId),
});
