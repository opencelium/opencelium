import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
	ConnectionSocketLog,
	ConnectionTextLog,
	ConnectorLog,
	DetailedMethodSegment, FlowchartProperty,
	LightSegment, LogError, TraceConfig, TraceConfigs,
} from '@root/requests/models/ConnectionLog';
import {
	deleteLogs,
	getDetailedMethod,
	getDetailedOperator, getFlowChartLogsByExecId, getLogList, getOperatorChildren, testConnection,
} from '../action_creators/ConnectionLogCreators';
import {findAndUpdateTrace} from "@root/utils/utils";

export interface ConnectionLogState {
	executionId: string,
	schedulerId: number,
	currentLog: ConnectionSocketLog<LightSegment>,
	currentLogError: {log: ConnectionSocketLog<LightSegment>, parentsPath: string[]},
	currentDirection: 'source' | 'target' | '',
	connectors: ConnectorLog[],
	textLogs: ConnectionTextLog[],
	isTesting: boolean,
	isFinished: boolean,
	isForcedFinished: boolean,
	executionTime: number,
	traceConfigs: TraceConfigs,
	logList: string[],
}

export const initialState: ConnectionLogState = {
	schedulerId: undefined,
	executionId: '',
	currentLog: undefined,
	currentLogError: {log: undefined, parentsPath: []},
	currentDirection: '',
	connectors: [],
	textLogs: [],
	isTesting: false,
	isFinished: false,
	isForcedFinished: false,
	executionTime: 0,
	traceConfigs: {},
	logList: [],
};
interface CleanTracePayload {
	flowId: string;
	indexPath: string;
}

export const connectionLogSlice = createSlice({
	name: 'connectionLog',
	initialState,
	reducers: {
		copyLogContentToClipboard: (state) => {
		},
		setTraceConfig: (state, action: PayloadAction<{config: TraceConfig, indexPath: string}>) => {
			state.traceConfigs = {...state.traceConfigs, [action.payload.indexPath]: action.payload.config};
		},
		setIsTesting: (state, action: PayloadAction<boolean>) => {
			state.isTesting = action.payload;
		},
		setIsForcedFinished: (state, action: PayloadAction<boolean>) => {
			state.isForcedFinished = action.payload;
		},
		setCurrentLogError: (state, action: PayloadAction<{log: ConnectionSocketLog<LightSegment>, parentsPath: string[]}>) => {
			state.currentLogError = {log: action.payload.log, parentsPath: Array.from(new Set(action.payload.parentsPath))};
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
			state.currentLogError = {log: undefined, parentsPath: []};
		},
		clearLogList: (state) => {
			state.logList = [];
		},
		clearSocketLog: (state) => {
			state.schedulerId = undefined;
			state.executionId = '';
			state.currentDirection = '';
			state.currentLog = undefined;
			state.connectors = [];
			state.currentLogError = {log: undefined, parentsPath: []};
			state.isFinished = false;
			state.isForcedFinished = false;
			state.traceConfigs = {};
		},
		addSocketLog: (state, action: PayloadAction<{data: ConnectionSocketLog<LightSegment>, settings: {executionTime?: number, hasNewLoopIndex: boolean, parentIndexPath: string}}>) => {
			const {executionId, flowId, connectorName, ...newTrace} = action.payload.data;
			if (newTrace.type === 'EXECUTION' && newTrace.status === 'COMPLETE') {
				state.isFinished = true;
				state.executionTime = action.payload.settings.executionTime;
				return;
			}
			if (state.executionId === executionId) {
				if (action.payload.settings.parentIndexPath) {
					const connector = state.connectors.find(c => c.flowId === flowId);
					findAndUpdateTrace(connector.traces, action.payload.settings.parentIndexPath, (trace) => {
						if (action.payload.settings.hasNewLoopIndex) {
							if (trace.type === 'LOOP') {
								//@ts-ignore
								trace.properties.size = +trace.properties.size ? +trace.properties.size + 1 : 1;
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
					const isIndexPathFirstLvl = action.payload.data?.indexPath ? action.payload.data?.indexPath.split('_').length === 1 : true;

					if (action.payload.data.type === 'FLOWCHART' && !state.connectors.find(c => c.flowId === flowId)) {
						state.connectors.push({flowId, name: connectorName, traces: []});
						return;
					}
					state.connectors.forEach((connector) => {
						if (connector.flowId === flowId) {
							if (action.payload.data.status === 'COMPLETE') {
								const hasUpdatedTrace = findAndUpdateTrace(connector.traces, action.payload.data.indexPath, (trace) => {
									if (!action.payload.settings.hasNewLoopIndex) {
										if (trace.type === 'IF') {
											trace.isCompleted = true;
											return true;
										}
									}
									if (!isIndexPathFirstLvl) {
										trace.isCompleted = true;
									}
									return false;
								});
								if (!hasUpdatedTrace) {
									let isCompleted = action.payload.data.type === 'OPERATION';
									if (!isIndexPathFirstLvl) {
										isCompleted = true;
									}
									connector.traces.push({...action.payload.data, isCompleted});
								}
							} else {
								let isCompleted = action.payload.data.type === 'OPERATION';
								if (!isIndexPathFirstLvl) {
									isCompleted = true;
								}
								connector.traces.push({...action.payload.data, isCompleted});
							}
							return;
						}
					});
				}
			} else {
				state.executionId = executionId;
				if (action.payload.data.type === 'FLOWCHART') {
					state.connectors.push({flowId, name: connectorName, traces: []});
				} else {
					state.connectors.push({flowId, name: connectorName, traces: [action.payload.data]});
				}
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
					findAndUpdateTrace(connector.traces, indexPath, (trace) => {
						if (trace.type === 'IF' || trace.type === 'LOOP') {
							trace.children = [];
							return true;
						}
						 return false;
					});
				}
			});
		},
	},
	extraReducers: (builder) => {
		builder.addCase(getLogList.fulfilled, (state, action) => {
			state.logList = action.payload.result;
		});
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
		builder.addCase(getFlowChartLogsByExecId.fulfilled, (state, action) => {
			state.connectors = action.payload.connectorLogs;
			state.executionId = action.payload.executionId;
		});
		builder.addCase(getOperatorChildren.fulfilled, (state, action) => {
			const { flowId, indexPath, executionId, loopIndex } = action.meta.arg;
			if (state.executionId !== executionId) return;
			const connector = state.connectors.find(c => c.flowId === flowId);
			if (!connector) return;
			findAndUpdateTrace(connector.traces, indexPath, (trace) => {
				if (trace.type === 'LOOP' || trace.type === 'IF') {
					trace.children = action.payload.map(t => {
						if (state.currentLogError.log) {
							if (state.currentLogError.parentsPath.indexOf(t.id) !== -1) {
								return {...t, hasError: true, isCompleted: true}
							} else {
								if (state.currentLogError.log.id === t.id) {
									return {...t, isCompleted: true, error: state.currentLogError.log.error};
								} else {
									return {...t, isCompleted: true}
								}
							}
						} else {
							return {...t, isCompleted: true}
						}
					});
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
			state.isFinished = false;
			state.isForcedFinished = false;
			state.traceConfigs = {};
		});
	},
});

export const {
	cleanMethodTrace, cleanOperatorTrace, addSocketLog,
	addTextLog, clearTextLog, clearSocketLog,
	setIsTesting, setCurrentLog, copyLogContentToClipboard,
	setCurrentLogError, setIsForcedFinished, setTraceConfig,
	clearLogList,
} =
	connectionLogSlice.actions;
export default connectionLogSlice.reducer;
