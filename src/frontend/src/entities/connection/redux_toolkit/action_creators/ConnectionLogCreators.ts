import { createAsyncThunk } from '@reduxjs/toolkit';
import { ConnectionLogRequest } from '@root/requests/classes/ConnectionLogRequest';
import {errorHandler} from "@application/utils/utils";
import {
	ConnectionSocketLog, ConnectorLog,
	DetailedMethodSegment,
	DetailedOperatorSegment,
	Trace
} from "@root/requests/models/ConnectionLog";
import {
	ConLogRequestProps,
	DeleteLogsRequest, GetLogListProps, GetLogListResponse,
	TestConnectionResponse
} from "@root/requests/interfaces/IConnectionLogRequest";


export const getDetailedMethod = createAsyncThunk<
	ConnectionSocketLog<DetailedMethodSegment>,
	ConLogRequestProps
>('connectionLog/getMethodTrace', async (data, thunkAPI) => {
	try {
		const connectionLogRequest = new ConnectionLogRequest();
		const response = await connectionLogRequest.getDetailedMethod(data);
		return response.data;
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const getDetailedOperator = createAsyncThunk<
	ConnectionSocketLog<DetailedOperatorSegment>,
	ConLogRequestProps
>('connectionLog/getOperatorTrace', async (data, thunkAPI) => {
	try {
		const connectionLogRequest = new ConnectionLogRequest();
		const response = await connectionLogRequest.getDetailedOperator(data);
		return response.data;
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const getOperatorChildren = createAsyncThunk<
	Trace[],
	ConLogRequestProps
>('connectionLog/getOperatorChildren', async (data, thunkAPI) => {
	try {
		const connectionLogRequest = new ConnectionLogRequest();
		const response = await connectionLogRequest.getOperatorChildren(data);
		return response.data;
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const getFlowChartLogsByExecId = createAsyncThunk<
	{connectorLogs: ConnectorLog[], executionId: string},
	string
>('connectionLog/getFlowChartLogsByExecId', async (executionId, thunkAPI) => {
	try {
		const connectionLogRequest = new ConnectionLogRequest();
		const flowChartResponse = await connectionLogRequest.getFlowCharts(executionId);
		const connectorLogs: ConnectorLog[] = [];
		for (let i = 0; i < flowChartResponse.data.length; i++) {
			const flowLog = flowChartResponse.data[i];
			const response = await connectionLogRequest.getFirstLevelLogs(flowLog.id);
			connectorLogs.push({
				flowId: flowLog.flowId,
				name: flowLog.connectorName,
				traces: response.data.map(t => ({...t, isCompleted: true})),
			})
		}
		return {connectorLogs, executionId};
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const deleteLogs = createAsyncThunk<void, DeleteLogsRequest>(
	'connectionLog/deleteLogs',
	async (data, thunkAPI) => {
		try {
			const connectionLogRequest = new ConnectionLogRequest();
			await connectionLogRequest.deleteLogs(data);
		} catch(e){
			return thunkAPI.rejectWithValue(errorHandler(e));
		}
	}
);

export const testConnection = createAsyncThunk<TestConnectionResponse, {connection: any, channelId?: string}>(
	'connectionLog/test-connection',
	async (data, thunkAPI) => {
		try {
			const params = data.channelId ? `?channelId=${data.channelId}` : '';
			const connectionLogRequest = new ConnectionLogRequest({endpoint: `/execution/test${params}`});
			const response = await connectionLogRequest.testConnection(data.connection);
			return response.data;
		} catch(e){
			return thunkAPI.rejectWithValue(errorHandler(e));
		}
	}
);

export const getLogList = createAsyncThunk<GetLogListResponse, GetLogListProps>(
	'connectionLog/list',
	async (data, thunkAPI) => {
		try {
			const connectionLogRequest = new ConnectionLogRequest();
			const response = await connectionLogRequest.getLogList(data);
			return response.data;
		} catch(e){
			return thunkAPI.rejectWithValue(errorHandler(e));
		}
	}
);

export default {
	getDetailedMethod,
	getDetailedOperator,
	deleteLogs,
	testConnection,
	getFlowChartLogsByExecId,
	getLogList,
}
