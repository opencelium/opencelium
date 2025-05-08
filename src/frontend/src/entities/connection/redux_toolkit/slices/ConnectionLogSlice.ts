import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	ConnectionLog, ConnectionSocketLog,
	MethodTrace,
	OperatorTrace,
} from '@root/requests/models/ConnectionLog';
import {
	deleteLogs,
	getMethodTrace,
	getOperatorTrace, testConnection,
} from '../action_creators/ConnectionLogCreators';
import {findAndUpdateTrace} from "@root/utils/utils";

export interface ConnectionLogState extends ConnectionLog {
}

export const initialState: ConnectionLogState = {
	connectionId: '',
	executionId: '',
	connectors: [],
};
interface CleanTracePayload {
	connectorId: string;
	indexPath: string;
}

export const connectionLogSlice = createSlice({
	name: 'connectionLog',
	initialState,
	reducers: {
		addSocketLog: (state, action: PayloadAction<ConnectionSocketLog>) => {
			const {executionId, connectionId, connectorId, connectorName, ...newTrace} = action.payload;
			if (state.executionId === action.payload.executionId && state.connectionId === action.payload.connectionId) {
				let hasConnector = false;
				state.connectors.forEach((connector) => {
					if (connector.id === action.payload.connectorId) {
						hasConnector = true;
						connector.traces.push(newTrace);
						return;
					}
				});
				if (!hasConnector) {
					state.connectors.push({
						id: connectorId,
						name: connectorName,
						traces: [newTrace],
					})
				}
			} else {
				state.executionId = executionId;
				state.connectionId = connectionId;
				state.connectors = [{id: connectorId, name: connectorName, traces: [newTrace]}]
			}
		},
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
			const { connectorId, indexPath, executionId } = action.meta.arg;
			if (!action.payload.requestDetails){
				console.log(indexPath)
			}
			const {requestDetails, responseDetails} = action.payload;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.id === connectorId);
			if (!connector) return;

			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.logType === 'method') {
					(trace as MethodTrace).requestDetails = requestDetails;
					(trace as MethodTrace).responseDetails = responseDetails;
					return true;
				}
				return false;
			});
		});
		builder.addCase(getOperatorTrace.fulfilled, (state, action) => {
			const { connectorId, indexPath, executionId } = action.meta.arg;
			if (!action.payload.traces){
				console.log(indexPath)
			}
			const {traces} = action.payload;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.id === connectorId);
			if (!connector) return;
			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.logType === 'operator') {
					(trace as OperatorTrace).traces = traces;
					return true;
				}
				return false;
			});
		});
		builder.addCase(deleteLogs.fulfilled, (state, action) => {
			const { connectionId } = action.meta.arg;
			if (state.connectionId === connectionId) {
				state.connectors = [];
				state.connectionId = '';
				state.executionId = '';
			}
		});
	},
});

export const {
	cleanMethodTrace, cleanOperatorTrace, addSocketLog,
} =
	connectionLogSlice.actions;
export default connectionLogSlice.reducer;
