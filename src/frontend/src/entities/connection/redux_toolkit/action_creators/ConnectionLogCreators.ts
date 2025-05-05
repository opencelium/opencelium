import { createAsyncThunk } from '@reduxjs/toolkit';
import { ConnectionLogRequest } from '@root/requests/classes/ConnectionLogRequest';
import {
	DeleteLogsRequest,
	GetMethodTraceRequest,
	GetMethodTraceResponse,
	GetOperatorTraceResponse,
	GetOperatorTraceRequest,
} from '@root/requests/interfaces/IConnectionLog';
import {errorHandler, timeout} from "@application/utils/utils";
import {Methods, Operators} from "../../../../socket/dev-tools/connection_logs_mock";


export const getMethodTrace = createAsyncThunk<
	GetMethodTraceResponse,
	GetMethodTraceRequest
>('connectionLog/getMethodTrace', async (request, thunkAPI) => {
	try {
		await timeout(1000);
		return Methods[request.connectorId][request.indexPath];
		const connectionLogRequest = new ConnectionLogRequest({endpoint: `/${request.executionId}/meta`});
		//const response = await connectionLogRequest.getMethodTrace();
		//return response.data;
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const getOperatorTrace = createAsyncThunk<
	GetOperatorTraceResponse,
	GetOperatorTraceRequest
>('connectionLog/getOperatorTrace', async (request, thunkAPI) => {
	try {
		await timeout(1000);
		return Operators[request.connectorId][request.indexPath];
		/*const endpointParams = request.iterationIndexes && request.iterationIndexes.length > 0 ? `?loopIndex=${request.iterationIndexes.join(',')}` : '';
		const connectionLogRequest = new ConnectionLogRequest({endpoint: `/${request.executionId}/connector/${request.connectorId}/element/${request.indexPath}/child${endpointParams}`});
		const response = await connectionLogRequest.getOperatorTrace();
		return response.data;*/
	} catch(e){
		return thunkAPI.rejectWithValue(errorHandler(e));
	}
});

export const deleteLogs = createAsyncThunk<void, DeleteLogsRequest>(
	'connectionLog/deleteLogs',
	async (request, thunkAPI) => {
		try {
			await timeout(1000);
			//const connectionLogRequest = new ConnectionLogRequest({endpoint: `/${request.executionId}`});
			//await connectionLogRequest.deleteLogs();
			return;
		} catch(e){
			return thunkAPI.rejectWithValue(errorHandler(e));
		}
	}
);

export default {
	getMethodTrace,
	getOperatorTrace,
	deleteLogs,
}
