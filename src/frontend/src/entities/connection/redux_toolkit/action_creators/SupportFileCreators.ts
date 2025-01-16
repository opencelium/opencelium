import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteApiRequestProps } from "@application/requests/interfaces/IApplication";
import { ApplicationRequest } from "@application/requests/classes/Application";
import { errorHandler } from "@application/utils/utils";
import {RuleRequest} from "@root/requests/classes/Rule";
import {RuleBaseModel, RuleRecordModel} from "@root/requests/models/Rule";
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
            await request.getSupportFilesByConnection();
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getSupportFiles = createAsyncThunk(
    'connection/get/all/support-file',
    async(data: never, thunkAPI) => {
        try{
            const request = new SupportFileRequest({endpoint: `/list`});
            await request.getSupportFiles();
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
