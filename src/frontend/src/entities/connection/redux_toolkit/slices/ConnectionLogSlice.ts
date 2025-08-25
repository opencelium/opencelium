import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	ConnectionSocketLog,
	ConnectionTextLog,
	ConnectorLog,
	DetailedMethodSegment, FlowchartProperty,
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
	currentLog: ConnectionSocketLog<LightSegment>,
	currentDirection: 'source' | 'target' | '',
	connectors: ConnectorLog[],
	textLogs: ConnectionTextLog[],
	isTesting: boolean,
}

export const initialState: ConnectionLogState = {
	schedulerId: undefined,
	executionId: '',
	currentLog: undefined,
	currentDirection: '',
	connectors: [],
	textLogs: [],
	isTesting: false,
};
interface CleanTracePayload {
	flowId: string;
	indexPath: string;
}

export const connectionLogSlice = createSlice({
	name: 'connectionLog',
	initialState,
	reducers: {
		setIsTesting: (state, action: PayloadAction<boolean>) => {
			state.isTesting = action.payload;
		},
		setCurrentLog: (state, action: PayloadAction<ConnectionSocketLog<LightSegment>>) => {
			if (!state.currentLog?.error?.message) {
				state.currentLog = action.payload;
			} else {
				state.isTesting = false;
			}
			if (action.payload.type === 'FLOWCHART' && action.payload.status === 'PENDING') {
				state.currentDirection = (action.payload.properties as FlowchartProperty).DIRECTION;
			}
			if (action.payload.type === 'EXECUTION' && action.payload.status === 'COMPLETE') {
				//state.currentDirection = '';
			}
		},
		addTextLog: (state, action: PayloadAction<ConnectionTextLog>) => {
			state.textLogs.push(action.payload)
		},
		clearTextLog: (state) => {
			state.textLogs = [];
		},
		clearSocketLog: (state) => {
			state.schedulerId = undefined;
			state.executionId = '';
			state.currentDirection = '';
			state.currentLog = undefined;
			state.connectors = [];
		},
		addSocketLog: (state, action: PayloadAction<{data: ConnectionSocketLog<LightSegment>, settings: {hasNewLoopIndex: boolean, parentIndexPath: string}}>) => {
			const {executionId, flowId, connectorName, ...newTrace} = action.payload.data;
			if (state.executionId === executionId) {
				if (action.payload.settings.parentIndexPath) {
					const connector = state.connectors.find(c => c.flowId === flowId);
					findAndUpdateTrace(connector.traces, action.payload.settings.parentIndexPath, (trace) => {
						if (action.payload.settings.hasNewLoopIndex) {
							if (trace.type === 'LOOP') {
								//@ts-ignore
								trace.properties.size = trace.properties.size ? trace.properties.size + 1 : 1;
								trace.isCompleted = true;
								return true;
							}
						} else {
							if (trace.type === 'IF') {
								return true;
							}
						}
						return false;
					});
				} else {
					let hasConnector = false;
					state.connectors.forEach((connector) => {
						if (connector.flowId === flowId) {
							hasConnector = true;
							if (action.payload.data.status === 'COMPLETE') {
								console.log(connector.traces);
								findAndUpdateTrace(connector.traces, action.payload.data.indexPath, (trace) => {
									if (!action.payload.settings.hasNewLoopIndex) {
										if (trace.type === 'IF') {
											trace.isCompleted = true;
											return true;
										}
									}
									return false;
								});
							} else {
								connector.traces.push({...action.payload.data, isCompleted: action.payload.data.type === 'OPERATION'});
							}
							return;
						}
					});
					if (!hasConnector) {
						state.connectors.push({
							flowId,
							name: connectorName,
							traces: [action.payload.data],
						})
					}
				}
			} else {
				state.executionId = executionId;
				state.connectors = [{flowId, name: connectorName, traces: [action.payload.data]}]
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
	addTextLog, clearTextLog, clearSocketLog,
	setIsTesting, setCurrentLog,
} =
	connectionLogSlice.actions;
export default connectionLogSlice.reducer;
