import { createAsyncThunk } from '@reduxjs/toolkit';
import { ConnectionLogRequest } from '@root/requests/classes/ConnectionLogRequest';
import {
	DeleteLogsRequest,
	GetMethodTraceRequest,
	GetMethodTraceResponse,
	GetOperatorTraceRequest,
	GetOperatorTraceResponse,
} from '@root/requests/interfaces/IConnectionLog';

const connectionLogRequest = new ConnectionLogRequest();

export const getMethodTrace = createAsyncThunk<
	GetMethodTraceResponse,
	GetMethodTraceRequest
>('connectionLog/getMethodTrace', async (request, thunkAPI) => {
	const response = await connectionLogRequest.getMethodTrace(request);
	return response;
});

export const getOperatorTrace = createAsyncThunk<
	GetOperatorTraceResponse,
	GetOperatorTraceRequest
>('connectionLog/getOperatorTrace', async (request, thunkAPI) => {
	const response = await connectionLogRequest.getOperatorTrace(request);
	return response;
});

export const deleteLogs = createAsyncThunk<void, DeleteLogsRequest>(
	'connectionLog/deleteLogs',
	async (request, thunkAPI) => {
		await connectionLogRequest.deleteLogs(request);
		return;
	}
);

export default {
	getMethodTrace,
	getOperatorTrace,
	deleteLogs,
}
