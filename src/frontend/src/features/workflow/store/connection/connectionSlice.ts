import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
	Connection,
	Enhancement,
	MethodWithId,
	OperatorWithId,
} from '../../types/connection';
import type { Connector } from '../../types/connector';

interface ConnectionState {
	connection: Connection | null;
	flowId: string | null;
}

const initialState: ConnectionState = {
	connection: null,
	flowId: null,
};

interface UpdatePayloadAction {
	methodId: string;
	newFields: any;
	messageProperty: 'body' | 'header';
}

interface UpdateEndpointAction {
	methodId: string;
	endpoint: string;
}

interface UpdateQueryParamsAction {
	methodId: string;
	queryParams: any[];
}

interface UpsertEndpointArgAction {
	methodId: string;
	argId: string;
	patch: any;
}

interface RemoveEndpointArgAction {
	methodId: string;
	argId: string;
}

export const connectionSlice = createSlice({
	name: 'connection',
	initialState,
	reducers: {
		setInitialConnection: (state, action: PayloadAction<number>) => {
			state.connection = {
				connectionId: action.payload,
				name: '',
				description: '',
				fromConnector: {
					connectorId: -1,
					title: 'DEFAULT',
					method: [],
					operator: [],
				},
				toConnector: null,
				fieldBindings: [
					// {
					// 	enhancement: {
					// 		enhanceId: '1',
					// 		language: Language.JavaScript,
					// 		script: 'RESULT_VAR = VAR_0',
					// 		args: {
					// 			RESULT_VAR: `${MethodColors[2]}.(request).body.$.name`,
					// 			VAR_0: `${MethodColors[0]}.(response).body.$.[0]`,
					// 			VAR_1: `${MethodColors[1]}.(response).body.$.name`,
					// 		},
					// 	},
					// },
				],
				ui: {
					flowcharts: [],
					flowchartEdges: [],
					operators: [],
				}
			};
		},
		setConnection: (state, action: PayloadAction<Connection>) => {
			state.connection = action.payload;
		},
		updateConnection: (state, action: PayloadAction<Partial<Connection>>) => {
			if (state.connection) {
				state.connection = { ...state.connection, ...action.payload };
			}
		},
		addFlowchart: (
			state,
			action: PayloadAction<{ flowId: string; connector: Connector }>
		) => {
			if (state.connection) {
				const { flowId, connector } = action.payload;
				state.flowId = flowId;
				state.connection = {
					...state.connection,
					fromConnector: {
						...state.connection.fromConnector,
						connectorId: connector.connectorId,
						title: connector.title,
					},
				};
			}
		},
		removeFlowchart: (state, action: PayloadAction<string>) => {
			if (state.connection) {
				if (state.flowId === action.payload) state.flowId = null;
			}
		},
		addMethod: (state, action: PayloadAction<MethodWithId>) => {
			if (!state.connection) return;
			state.connection.fromConnector.method.push(action.payload);
		},
		removeMethod: (state, action: PayloadAction<string>) => {
			if (!state.connection) return;
			const methodIndex = action.payload;
			const methods = state.connection.fromConnector.method;
			const removeIndex = methods.findIndex((m) => m.index === methodIndex);
			if (removeIndex !== -1) methods.splice(removeIndex, 1);
		},
		addOperator: (state, action: PayloadAction<OperatorWithId>) => {
			if (!state.connection) return;
			state.connection.fromConnector.operator.push(action.payload);
		},
		removeOperator: (state, action: PayloadAction<string>) => {
			if (!state.connection) return;
			const operatorIndex = action.payload;
			const operators = state.connection.fromConnector.operator;
			const removeIndex = operators.findIndex((o) => o.index === operatorIndex);
			if (removeIndex !== -1) operators.splice(removeIndex, 1);
		},
		updatePayload: (state, action: PayloadAction<UpdatePayloadAction>) => {
			const { methodId, newFields, messageProperty } = action.payload;
			if (!state.connection) return;

			const methods = state.connection.fromConnector.method;
			const methodIndex = methods.findIndex(
				(m) => m.id === methodId
			);
			if (methodIndex === -1) return;

			const method = methods[methodIndex];

			if (messageProperty === 'body') {
				methods[methodIndex] = {
					...method,
					request: {
						...method.request,
						body: {
							...method.request.body,
							fields: newFields,
						},
					},
				};
			} else if (messageProperty === 'header') {
				methods[methodIndex] = {
					...method,
					request: {
						...method.request,
						header: newFields,
					},
				};
			}
		},

		clearConnection: (state) => {
			state.connection = null;
		},
		setFlowchart: (state, action: PayloadAction<string>) => {
			state.flowId = action.payload;
		},
		clearFlowchart: (state) => {
			state.flowId = null;
		},
		updateEndpoint: (state, action: PayloadAction<UpdateEndpointAction>) => {
			const { methodId, endpoint } = action.payload;
			if (!state.connection) return;

			const methods = state.connection.fromConnector.method;
			const methodIndex = methods.findIndex(
				(m) => m.id === methodId
			);
			if (methodIndex === -1) return;

			const method = methods[methodIndex];

			methods[methodIndex] = {
				...method,
				request: {
					...method.request,
					endpoint,
				},
			};
		},
		updateQueryParams: (
			state,
			action: PayloadAction<UpdateQueryParamsAction>
		) => {
			const { methodId, queryParams } = action.payload;
			if (!state.connection) return;

			const methods = state.connection.fromConnector.method;
			const methodIndex = methods.findIndex(
				(m) => m.id === methodId
			);
			if (methodIndex === -1) return;

			const method = methods[methodIndex];

			methods[methodIndex] = {
				...method,
				request: {
					...method.request,
					queryParams: queryParams || [],
				},
			};
		},

		upsertEndpointArg: (
			state,
			action: PayloadAction<UpsertEndpointArgAction>
		) => {
			const { methodId, argId, patch } = action.payload;
			if (!state.connection) return;

			const methods = state.connection.fromConnector.method;
			const methodIndex = methods.findIndex(
				(m) => m.id === methodId
			);
			if (methodIndex === -1) return;

			const method = methods[methodIndex];

			const currentArgs = (method.request as any).endpointArgs || {};
			const prev = currentArgs[argId] || { id: argId };
			const next = { ...prev, ...patch, id: argId };

			methods[methodIndex] = {
				...method,
				request: {
					...method.request,
					endpointArgs: {
						...currentArgs,
						[argId]: next,
					},
				},
			};
		},

		removeEndpointArg: (
			state,
			action: PayloadAction<RemoveEndpointArgAction>
		) => {
			const { methodId, argId } = action.payload;
			if (!state.connection) return;

			const methods = state.connection.fromConnector.method;
			const methodIndex = methods.findIndex(
				(m) => m.id === methodId
			);
			if (methodIndex === -1) return;

			const method = methods[methodIndex];

			const currentArgs = (method.request as any).endpointArgs || {};
			if (!currentArgs[argId]) return;

			const nextArgs = { ...currentArgs };
			delete nextArgs[argId];

			methods[methodIndex] = {
				...method,
				request: {
					...method.request,
					endpointArgs: nextArgs,
				},
			};
		},
		upsertFieldBinding: (
			state,
			action: PayloadAction<{ enhancement: Enhancement }>
		) => {
			if (!state.connection) return;

			const enh = action.payload.enhancement;
			if (!enh?.enhanceId) return;

			const arr = state.connection.fieldBindings || [];

			const idx = arr.findIndex(
				(b) => b?.enhancement?.enhanceId === enh.enhanceId
			);

			if (idx === -1) {
				state.connection.fieldBindings = [...arr, { enhancement: enh }];
			} else {
				const next = arr.slice();
				next[idx] = { enhancement: enh };
				state.connection.fieldBindings = next;
			}
		},

		removeFieldBinding: (
			state,
			action: PayloadAction<{ enhanceId: string }>
		) => {
			if (!state.connection) return;

			const id = action.payload.enhanceId;
			const arr = state.connection.fieldBindings || [];
			state.connection.fieldBindings = arr.filter(
				(b) => b?.enhancement?.enhanceId !== id
			);
		},
	},
});

export const {
	setConnection,
	updateConnection,
	clearConnection,
	setInitialConnection,
	addFlowchart,
	updatePayload,
	setFlowchart,
	clearFlowchart,
	removeFlowchart,
	addMethod,
	removeMethod,
	addOperator,
	removeOperator,
	updateEndpoint,
	updateQueryParams,
	upsertEndpointArg,
	removeEndpointArg,
	upsertFieldBinding,
	removeFieldBinding,
} = connectionSlice.actions;
export default connectionSlice.reducer;
