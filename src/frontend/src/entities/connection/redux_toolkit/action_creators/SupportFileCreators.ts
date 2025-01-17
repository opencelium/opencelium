import { createAsyncThunk } from "@reduxjs/toolkit";
import { errorHandler } from "@application/utils/utils";
import {SupportFileRequest} from "@root/requests/classes/SupportFile";

export const downloadSupportFile = createAsyncThunk(
    'connection/download/support-file',
    async(data: {connectionId: number, zipFileName: string}, thunkAPI) => {
        try{
            const request = new SupportFileRequest({endpoint: `/${data.connectionId}/${data.zipFileName}`});
            await request.downloadSupportFile();
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const downloadSuccessSupportFile = createAsyncThunk(
    'connection/download/success-support-file',
    async(data: {connectionId: number}, thunkAPI) => {
        try{
            const request = new SupportFileRequest({endpoint: `/${data.connectionId}`});
            await request.downloadSuccessSupportFile();
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getSupportFilesByConnection = createAsyncThunk(
    'connection/get/all/by-connection/support-file',
    async(data: {connectionId: number}, thunkAPI) => {
        try{
            const request = new SupportFileRequest({endpoint: `/${data.connectionId}/list`});
            const response = await request.getSupportFilesByConnection();
            return response.data?.supportFiles.length > 0 ? response.data : undefined;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getSupportFiles = createAsyncThunk(
    'connection/get/all/support-file',
    async(data: never, thunkAPI) => {
        try{
            return [{connectionId: 1, supportFiles: ['filename1']}]
            const request = new SupportFileRequest({endpoint: `/list`});
            const response = await request.getSupportFiles();
            return response.data.filter(r => r.supportFiles.length > 0);
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    downloadSupportFile,
    downloadSuccessSupportFile,
    getSupportFilesByConnection,
    getSupportFiles,
}
