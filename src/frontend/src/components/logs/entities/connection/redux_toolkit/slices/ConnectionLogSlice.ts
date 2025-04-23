import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	ConnectionLog,
	ConnectorLog,
	MethodTrace,
	OperatorTrace,
	Trace,
} from '../../../connection/requests/models/ConnectionLog';
import {
	deleteLogs,
	getMethodTrace,
	getOperatorTrace,
} from '../action_creators/ConnectionLogCreators';

export interface ConnectionLogState extends ConnectionLog {}

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
					httpMethod: 'GET',
					executionTime: 42,
					indexPath: '0',
					url: 'https://i-doit.api.de',
					statusCode: 200,
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
							httpMethod: 'POST',
							executionTime: 42,
							indexPath: '1_1',
							url: 'https://i-doit.api.de/post-method',
							statusCode: 200,
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
					httpMethod: 'POST',
					executionTime: 42,
					indexPath: '0',
					url: 'https://otrs.api.de',
					statusCode: 200,
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
									httpMethod: 'PUT',
									executionTime: 42,
									indexPath: '1_0_0_1',
									url: 'https://otrs.api.de/put-method',
									statusCode: 200,
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
									httpMethod: 'DELETE',
									executionTime: 42,
									indexPath: '1_0_0_2',
									url: 'https://otrs.api.de/delete-method',
									statusCode: 200,
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
							httpMethod: 'POST',
							executionTime: 42,
							indexPath: '1_1',
							url: 'https://otrs.api.de/post-method',
							statusCode: 200,
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

interface CleanTracePayload {
	connectorId: string;
	indexPath: string;
}

export const connectionLogSlice = createSlice({
	name: 'connectionLog',
	initialState,
	reducers: {
		cleanMethodTrace: (state, action: PayloadAction<CleanTracePayload>) => {
			const { connectorId, indexPath } = action.payload;
			state.connectors.forEach((connector) => {
				if (connector.id === connectorId) {
					connector.traces.forEach((trace) => {
						if (trace.logType === 'method' && trace.indexPath === indexPath) {
							delete (trace as MethodTrace).requestDetails;
							delete (trace as MethodTrace).responseDetails;
						}
					});
				}
			});
		},

		cleanOperatorTrace: (state, action: PayloadAction<CleanTracePayload>) => {
			const { connectorId, indexPath } = action.payload;
			state.connectors.forEach((connector) => {
				if (connector.id === connectorId) {
					connector.traces.forEach((trace) => {
						if (trace.logType === 'operator' && trace.indexPath === indexPath) {
							(trace as OperatorTrace).traces = [];
						}
					});
				}
			});
		},
	},
	extraReducers: (builder) => {
		builder.addCase(getMethodTrace.fulfilled, (state, action) => {
			const { connectorId, indexPath, connectionId } = action.meta.arg;
			if (state.connectionId !== connectionId) return;
			const connector = state.connectors.find((c) => c.id === connectorId);
			if (connector) {
				const trace = connector.traces.find(
					(t) => t.logType === 'method' && t.indexPath === indexPath
				) as MethodTrace | undefined;
				if (trace) {
					trace.requestDetails = action.payload.request;
					trace.responseDetails = action.payload.response;
				} else {
					const newTrace: MethodTrace = {
						logType: 'method',
						indexPath,
						httpMethod: 'GET',
						statusCode: 200,
						url: '',
						executionTime: 0,
						requestDetails: action.payload.request,
						responseDetails: action.payload.response,
					};
					connector.traces.push(newTrace);
				}
			}
		});
		builder.addCase(getOperatorTrace.fulfilled, (state, action) => {
			const { connectorId, indexPath, connectionId } = action.meta.arg;
			if (state.connectionId !== connectionId) return;
			const connector = state.connectors.find((c) => c.id === connectorId);
			if (connector) {
				const trace = connector.traces.find(
					(t) => t.logType === 'operator' && t.indexPath === indexPath
				) as OperatorTrace | undefined;
				if (trace) {
					trace.traces = [...trace.traces, ...action.payload.logs];
				} else {
					const operatorItem = action.payload.logs.find(
						(item) => item.logType === 'operator'
					) as OperatorTrace | undefined;
					const newTrace: OperatorTrace = {
						logType: 'operator',
						indexPath,
						conditionStatement: operatorItem?.conditionStatement ?? '',
						info: operatorItem?.info ?? {
							type: 'if',
							conditionResult: false,
						},
						traces: action.payload.logs,
					};
					connector.traces.push(newTrace);
				}
			}
		});

		builder.addCase(deleteLogs.fulfilled, (state, action) => {
			const { connectionId } = action.meta.arg;
			if (state.connectionId === connectionId) {
				state.connectors = [];
			}
		});
	},
});

export const { cleanMethodTrace, cleanOperatorTrace } =
	connectionLogSlice.actions;
export default connectionLogSlice.reducer;
