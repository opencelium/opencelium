import { ConnectionLogRequest } from './entities/connection/requests/classes/ConnectionLogRequest';
import {
	DeleteLogsRequest,
	GetMethodTraceRequest,
	GetOperatorTraceRequest,
} from './entities/connection/requests/interfaces/IConnectionLog';

import reducer, {
	cleanMethodTrace,
	cleanOperatorTrace,
	ConnectionLogState,
} from './entities/connection/redux_toolkit/slices/ConnectionLogSlice';

import {
	deleteLogs,
	getMethodTrace,
	getOperatorTrace,
} from './entities/connection/redux_toolkit/action_creators/ConnectionLogCreators';

import {
	MethodTrace,
	OperatorTrace,
	Trace,
} from './entities/connection/requests/models/ConnectionLog';

function isMethodTrace(trace: Trace): trace is MethodTrace {
	return trace.logType === 'method';
}

function isOperatorTrace(trace: Trace): trace is OperatorTrace {
	return trace.logType === 'operator';
}

const initialState: ConnectionLogState = {
	connectionId: '13',
	executionId: '26',
	connectors: [
		{
			id: '1',
			name: 'i-doit',
			traces: [
				{
					logType: 'method',
					indexPath: '0',
					httpMethod: 'GET',
					statusCode: 200,
					url: 'https://i-doit.api.de',
					executionTime: 42,
					requestDetails: {
						headers: {
							Authorization: '{token}',
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: {
							role: '#C77E7E.(response).body.$.data',
							name: '',
							id: '',
							units: [],
							department: '',
						},
					},
					responseDetails: {
						headers: {
							Authorization: '{token}',
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: {
							role: '#C77E7E.(response).body.$.data',
							name: '',
							id: '',
							units: [],
							department: '',
						},
					},
				},
				{
					logType: 'operator',
					indexPath: '1',
					conditionStatement: 'for {%#FFCFB5.(response).body.$.[*]%}',
					info: {
						type: 'loop',
						iteration: {
							current: 1,
							total: 50,
						},
					},
					traces: [
						{
							logType: 'operator',
							indexPath: '1_0',
							conditionStatement:
								'({%#C77E7E.(response).body.$.data%} IsEmpty)',
							info: {
								type: 'if',
								conditionResult: true,
							},
							traces: [],
						},
						{
							logType: 'method',
							indexPath: '1_1',
							httpMethod: 'POST',
							statusCode: 200,
							url: 'https://i-doit.api.de/post-method',
							executionTime: 42,
							requestDetails: {
								headers: {
									Authorization: '{token}',
									'Content-Type': 'application/x-www-form-urlencoded',
								},
								body: {
									role: '#C77E7E.(response).body.$.data',
									name: '',
									id: '',
									units: [],
									department: '',
								},
							},
							responseDetails: {
								headers: {
									Authorization: '{token}',
									'Content-Type': 'application/x-www-form-urlencoded',
								},
								body: {
									networkName: '',
									unitID: '',
								},
							},
						},
					],
				},
			],
		},
		{
			id: '2',
			name: 'otrs',
			traces: [
				{
					logType: 'method',
					indexPath: '0',
					httpMethod: 'POST',
					statusCode: 200,
					url: 'https://otrs.api.de',
					executionTime: 42,
					requestDetails: {
						headers: {
							Authorization: '{token}',
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: {
							role: '#C77E7E.(response).body.$.data',
							name: '',
							id: '',
							units: [],
							department: '',
						},
					},
					responseDetails: {
						headers: {
							Authorization: '{token}',
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: {
							role: '#C77E7E.(response).body.$.data',
							name: '',
							id: '',
							units: [],
							department: '',
						},
					},
				},
				{
					logType: 'operator',
					indexPath: '1',
					conditionStatement: 'for {%#FFCFB5.(response).body.$.[*]%}',
					info: {
						type: 'loop',
						iteration: {
							current: 1,
							total: 50,
						},
					},
					traces: [
						{
							logType: 'operator',
							indexPath: '1_0',
							conditionStatement:
								'({%#C77E7E.(response).body.$.data%} IsEmpty)',
							info: {
								type: 'if',
								conditionResult: true,
							},
							traces: [
								{
									logType: 'operator',
									indexPath: '1_0_0',
									conditionStatement:
										'({%#C77E7E.(response).body.$.data%} IsEmpty)',
									info: {
										type: 'if',
										conditionResult: true,
									},
									traces: [
										{
											logType: 'operator',
											indexPath: '1_0_0_0',
											conditionStatement:
												'({%#C77E7E.(response).body.$.data%} IsEmpty)',
											info: {
												type: 'if',
												conditionResult: true,
											},
											traces: [],
										},
									],
								},
								{
									logType: 'method',
									indexPath: '1_0_0_1',
									httpMethod: 'PUT',
									statusCode: 200,
									url: 'https://otrs.api.de/put-method',
									executionTime: 42,
									requestDetails: {
										headers: {
											Authorization: '{token}',
											'Content-Type': 'application/x-www-form-urlencoded',
										},
										body: {
											role: '#C77E7E.(response).body.$.data',
											name: '',
											id: '',
											units: [],
											department: '',
										},
									},
									responseDetails: {
										headers: {
											Authorization: '{token}',
											'Content-Type': 'application/x-www-form-urlencoded',
										},
										body: {
											networkName: '',
											unitID: '',
										},
									},
								},
								{
									logType: 'method',
									indexPath: '1_0_0_2',
									httpMethod: 'DELETE',
									statusCode: 200,
									url: 'https://otrs.api.de/delete-method',
									executionTime: 42,
									requestDetails: {
										headers: {
											Authorization: '{token}',
											'Content-Type': 'application/x-www-form-urlencoded',
										},
										body: {
											role: '#C77E7E.(response).body.$.data',
											name: '',
											id: '',
											units: [],
											department: '',
										},
									},
									responseDetails: {
										headers: {
											Authorization: '{token}',
											'Content-Type': 'application/x-www-form-urlencoded',
										},
										body: {
											networkName: '',
											unitID: '',
										},
									},
								},
							],
						},
						{
							logType: 'method',
							indexPath: '1_1',
							httpMethod: 'POST',
							statusCode: 200,
							url: 'https://otrs.api.de/post-method',
							executionTime: 42,
							requestDetails: {
								headers: {
									Authorization: '{token}',
									'Content-Type': 'application/x-www-form-urlencoded',
								},
								body: {
									role: '#C77E7E.(response).body.$.data',
									name: '',
									id: '',
									units: [],
									department: '',
								},
							},
							responseDetails: {
								headers: {
									Authorization: '{token}',
									'Content-Type': 'application/x-www-form-urlencoded',
								},
								body: {
									networkName: '',
									unitID: '',
								},
							},
						},
					],
				},
			],
		},
	],
};

describe('ConnectionLogRequest', () => {
	const requestInstance = new ConnectionLogRequest();

	it('getMethodTrace возвращает корректный статичный ответ', async () => {
		const methodRequest: GetMethodTraceRequest = {
			executionId: '26',
			connectionId: '13',
			connectorId: '1',
			indexPath: '0',
		};
		const result = await requestInstance.getMethodTrace(methodRequest);
		expect(result.request.headers['Content-Type']).toBe('application/json');
		expect(result.request.body).toEqual({ example: 'method request body' });
		expect(result.response.headers['Content-Type']).toBe('application/json');
		expect(result.response.body).toEqual({ example: 'method response body' });
	});

	it('getOperatorTrace возвращает корректный статичный ответ', async () => {
		const operatorRequest: GetOperatorTraceRequest = {
			executionId: '26',
			connectionId: '13',
			connectorId: '1',
			indexPath: '1',
		};
		const result = await requestInstance.getOperatorTrace(operatorRequest);
		expect(result.logs).toHaveLength(1);

		const opTrace = result.logs[0];
		expect(isOperatorTrace(opTrace)).toBeTruthy();
		if (isOperatorTrace(opTrace)) {
			expect(opTrace.indexPath).toBe(operatorRequest.indexPath);
			expect(opTrace.conditionStatement).toBe('if (x > 0)');
			expect(opTrace.info).toEqual({ type: 'if', conditionResult: true });
			expect(opTrace.traces).toEqual([]);
		}
	});

	it('deleteLogs возвращает решённый промис', async () => {
		const deleteRequest: DeleteLogsRequest = {
			executionId: '26',
			connectionId: '13',
		};
		await expect(
			requestInstance.deleteLogs(deleteRequest)
		).resolves.toBeUndefined();
	});
});

describe('ConnectionLogSlice', () => {
	it('обновляет method trace при getMethodTrace.fulfilled', () => {
		const payload = {
			request: {
				headers: { 'Content-Type': 'application/json' },
				body: { value: 'methodReq' },
			},
			response: {
				headers: { 'Content-Type': 'application/json' },
				body: { value: 'methodRes' },
			},
		};

		const action = {
			type: getMethodTrace.fulfilled.type,
			payload,
			meta: {
				arg: {
					executionId: '26',
					connectionId: '13',
					connectorId: '1',
					indexPath: '0',
				},
			},
		};

		const newState = reducer(initialState, action);
		const connector = newState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const foundTrace = connector.traces.find((t) => t.indexPath === '0');
		if (!foundTrace || !isMethodTrace(foundTrace)) {
			throw new Error('MethodTrace не найден или имеет неверный тип');
		}
		expect(foundTrace.requestDetails).toEqual(payload.request);
		expect(foundTrace.responseDetails).toEqual(payload.response);
	});

	it('создаёт новый method trace, если не найден, при getMethodTrace.fulfilled', () => {
		const payload = {
			request: {
				headers: { 'Content-Type': 'application/json' },
				body: { value: 'newMethodReq' },
			},
			response: {
				headers: { 'Content-Type': 'application/json' },
				body: { value: 'newMethodRes' },
			},
		};

		const action = {
			type: getMethodTrace.fulfilled.type,
			payload,
			meta: {
				arg: {
					executionId: '26',
					connectionId: '13',
					connectorId: '1',
					indexPath: 'new_trace',
				},
			},
		};

		const newState = reducer(initialState, action);
		const connector = newState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const newTrace = connector.traces.find((t) => t.indexPath === 'new_trace');
		if (!newTrace || !isMethodTrace(newTrace)) {
			throw new Error('Новый MethodTrace не создан или имеет неверный тип');
		}
		expect(newTrace.requestDetails).toEqual(payload.request);
		expect(newTrace.responseDetails).toEqual(payload.response);
	});

	it('обновляет operator trace при getOperatorTrace.fulfilled (создание нового)', () => {
		const payload = {
			logs: [
				{
					logType: 'operator',
					indexPath: 'new_operator_trace',
					conditionStatement: 'if(x > 0)',
					info: { type: 'if', conditionResult: true },
					traces: [
						{
							logType: 'method',
							indexPath: 'inner_trace',
							httpMethod: 'GET',
							statusCode: 200,
							url: 'https://inner.com',
							executionTime: 50,
						},
					],
				},
			],
		};

		const action = {
			type: getOperatorTrace.fulfilled.type,
			payload,
			meta: {
				arg: {
					executionId: '26',
					connectionId: '13',
					connectorId: '1',
					indexPath: 'new_operator_trace',
				},
			},
		};

		const newState = reducer(initialState, action);
		const connector = newState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const foundTrace = connector.traces.find(
			(t) => t.indexPath === 'new_operator_trace'
		);
		if (!foundTrace || !isOperatorTrace(foundTrace)) {
			throw new Error('OperatorTrace не найден или имеет неверный тип');
		}
		expect(foundTrace.conditionStatement).toBe('if(x > 0)');
		expect(foundTrace.info).toEqual({ type: 'if', conditionResult: true });
		expect(foundTrace.traces).toEqual(payload.logs);
	});

	it('объединяет новые логи operator trace с уже существующими при getOperatorTrace.fulfilled', () => {
		const modifiedState: ConnectionLogState = JSON.parse(
			JSON.stringify(initialState)
		);
		const connector = modifiedState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const existingOperatorTrace = connector.traces.find(
			(t) => t.logType === 'operator' && t.indexPath === '1'
		) as OperatorTrace;
		existingOperatorTrace.traces = [
			{
				logType: 'method',
				indexPath: 'inner_trace_1',
				httpMethod: 'POST',
				statusCode: 201,
				url: 'https://inner1.com',
				executionTime: 80,
			},
		];
		const payload = {
			logs: [
				{
					logType: 'operator',
					indexPath: '1',
					conditionStatement: 'if(x > 0)',
					info: { type: 'if', conditionResult: true },
					traces: [
						{
							logType: 'method',
							indexPath: 'inner_trace_2',
							httpMethod: 'PUT',
							statusCode: 200,
							url: 'https://inner2.com',
							executionTime: 60,
						},
					],
				},
			],
		};

		const action = {
			type: getOperatorTrace.fulfilled.type,
			payload,
			meta: {
				arg: {
					executionId: '26',
					connectionId: '13',
					connectorId: '1',
					indexPath: '1',
				},
			},
		};

		const newState = reducer(modifiedState, action);
		const updatedOperatorTrace = newState.connectors
			.find((c) => c.id === '1')
			?.traces.find(
				(t) => t.logType === 'operator' && t.indexPath === '1'
			) as OperatorTrace;
		expect(updatedOperatorTrace.traces.length).toBe(2);
		expect(updatedOperatorTrace.traces[0]).toEqual(
			existingOperatorTrace.traces[0]
		);
		expect(updatedOperatorTrace.traces[1]).toEqual(payload.logs[0]);
	});

	it('удаляет все логи при deleteLogs.fulfilled', () => {
		const action = {
			type: deleteLogs.fulfilled.type,
			meta: { arg: { executionId: '26', connectionId: '13' } },
		};
		const newState = reducer(initialState, action);
		expect(newState.connectors.length).toBe(0);
	});

	it('очищает данные method trace с помощью cleanMethodTrace', () => {
		const action = cleanMethodTrace({
			connectorId: '1',
			indexPath: '0',
		});
		const newState = reducer(initialState, action);
		const connector = newState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const foundTrace = connector.traces.find((t) => t.indexPath === '0');
		if (foundTrace && isMethodTrace(foundTrace)) {
			expect(foundTrace.requestDetails).toBeUndefined();
			expect(foundTrace.responseDetails).toBeUndefined();
		}
	});

	it('ничего не меняется при cleanMethodTrace, если trace не найден', () => {
		const action = cleanMethodTrace({
			connectorId: 'connector_unknown',
			indexPath: 'nonexistent_trace',
		});
		const newState = reducer(initialState, action);
		expect(newState).toEqual(initialState);
	});

	it('очищает внутренние логи operator trace с помощью cleanOperatorTrace', () => {
		const action = cleanOperatorTrace({
			connectorId: '1',
			indexPath: '1',
		});
		const newState = reducer(initialState, action);
		const connector = newState.connectors.find((c) => c.id === '1');
		if (!connector) throw new Error('Connector не найден');
		const foundTrace = connector.traces.find((t) => t.indexPath === '1');
		if (foundTrace && isOperatorTrace(foundTrace)) {
			expect(foundTrace.traces).toEqual([]);
		}
	});

	it('ничего не меняется при cleanOperatorTrace, если trace не найден', () => {
		const action = cleanOperatorTrace({
			connectorId: 'connector_unknown',
			indexPath: 'nonexistent_trace',
		});
		const newState = reducer(initialState, action);
		expect(newState).toEqual(initialState);
	});
});
