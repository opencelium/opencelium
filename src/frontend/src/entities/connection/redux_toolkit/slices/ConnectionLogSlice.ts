import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	ConnectionSocketLog,
	ConnectionTextLog,
	ConnectorLog,
	DetailedMethodSegment,
	LightSegment,
} from '@root/requests/models/ConnectionLog';
import {
	deleteLogs,
	getDetailedMethod,
	getDetailedOperator, getOperatorChildren, testConnection,
} from '../action_creators/ConnectionLogCreators';
import {findAndUpdateTrace} from "@root/utils/utils";

export interface ConnectionLogState {
	executionId: string,
	schedulerId: number,
	connectors: ConnectorLog[],
	textLogs: ConnectionTextLog[],
}

export const initialState: ConnectionLogState = {
	schedulerId: undefined,
	executionId: '',
	connectors: [],
	textLogs: [],
};
interface CleanTracePayload {
	flowId: string;
	indexPath: string;
}

export const connectionLogSlice = createSlice({
	name: 'connectionLog',
	initialState,
	reducers: {
		addTextLog: (state, action: PayloadAction<ConnectionTextLog>) => {
			state.textLogs.push(action.payload)
		},
		clearTextLog: (state) => {
			state.textLogs = [];
		},
		addSocketLog: (state, action: PayloadAction<ConnectionSocketLog<LightSegment>>) => {
			const {executionId, flowId, connectorName, ...newTrace} = action.payload;
			if (state.executionId === action.payload.executionId) {
				let hasConnector = false;
				state.connectors.forEach((connector) => {
					if (connector.flowId === action.payload.flowId) {
						hasConnector = true;
						connector.traces.push(action.payload);
						return;
					}
				});
				if (!hasConnector) {
					state.connectors.push({
						flowId,
						name: connectorName,
						traces: [action.payload],
					})
				}
			} else {
				state.executionId = executionId;
				state.connectors = [{flowId, name: connectorName, traces: [action.payload]}]
			}
		},
		cleanMethodTrace: (state, action: PayloadAction<CleanTracePayload>) => {
			const { flowId, indexPath } = action.payload;
			state.connectors.forEach((connector) => {
				if (connector.flowId === flowId) {
					connector.traces.forEach((trace) => {
						if (trace.type === 'OPERATION' && trace.indexPath === indexPath) {
							delete (trace as ConnectionSocketLog<DetailedMethodSegment>).segment.request.header;
							delete (trace as ConnectionSocketLog<DetailedMethodSegment>).segment.request.payload;
							delete (trace as ConnectionSocketLog<DetailedMethodSegment>).segment.response.header;
							delete (trace as ConnectionSocketLog<DetailedMethodSegment>).segment.response.payload;
						}
					});
				}
			});
		},
		cleanOperatorTrace: (state, action: PayloadAction<CleanTracePayload>) => {
			const { flowId, indexPath } = action.payload;
			state.connectors.forEach((connector) => {
				if (connector.flowId === flowId) {
					connector.traces.forEach((trace) => {
						if ((trace.type === 'IF' || trace.type === 'LOOP') && trace.indexPath === indexPath) {
							trace.children = [];
						}
					});
				}
			});
		},
	},
	extraReducers: (builder) => {
		builder.addCase(testConnection.fulfilled, (state, action) => {
			state.schedulerId = action.payload.schedulerId;
		});
		builder.addCase(getDetailedMethod.fulfilled, (state, action) => {
			const { flowId, indexPath, executionId } = action.meta.arg;
			const {segment} = action.payload;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.flowId === flowId);
			if (!connector) return;
			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.type === 'OPERATION') {
					trace.segment = segment;
					return true;
				}
				return false;
			});
		});
		builder.addCase(getDetailedOperator.fulfilled, (state, action) => {
			const { flowId, indexPath, executionId } = action.meta.arg;
			const {segment} = action.payload;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.flowId === flowId);
			if (!connector) return;
			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.type === 'LOOP' || trace.type === 'IF') {
					trace.segment = segment;
					return true;
				}
				return false;
			});
		});
		builder.addCase(getOperatorChildren.fulfilled, (state, action) => {
			const { flowId, indexPath, executionId, loopIndex } = action.meta.arg;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.flowId === flowId);
			if (!connector) return;
			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.type === 'LOOP' || trace.type === 'IF') {
					trace.children = action.payload;
					return true;
				}
				return false;
			});
		});
		builder.addCase(deleteLogs.fulfilled, (state, action) => {
			const { executionId } = action.meta.arg;
			if (state.executionId === executionId) {
				state.executionId = '';
				state.schedulerId = undefined;
				state.connectors = [];
				state.textLogs = [];
			}
		});
	},
});

export const {
	cleanMethodTrace, cleanOperatorTrace, addSocketLog,
	addTextLog, clearTextLog,
} =
	connectionLogSlice.actions;
export default connectionLogSlice.reducer;
