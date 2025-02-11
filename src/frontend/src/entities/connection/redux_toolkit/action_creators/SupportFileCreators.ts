import { createAsyncThunk } from "@reduxjs/toolkit";
import { errorHandler } from "@application/utils/utils";
import {SupportFileRequest} from "@root/requests/classes/SupportFile";
import {DeleteSupportFilesRequest} from "@root/requests/interfaces/ISupportFile";

export const downloadSupportFile = createAsyncThunk(
    'connection/download/support-file',
    async(data: {connectionId: number, zipFileName: string}, thunkAPI) => {
        try{
            const request = new SupportFileRequest({isApi: false, endpoint: `${data.zipFileName.substring(1)}`});
            const response = await request.downloadSupportFile();
            const filename = data.zipFileName.split("/").pop();
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
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
            const request = new SupportFileRequest({endpoint: `/list`});
            const response = await request.getSupportFiles();
            return response.data.map((file => ({...file, id: file.connectionId}))).filter(r => r.supportFiles.length > 0);
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const deleteSupportFile = createAsyncThunk(
    'connection/delete/support-file',
    async(filename: string, thunkAPI) => {
        try{
            const request = new SupportFileRequest({endpoint: `/${filename}`});
            await request.deleteSupportFile();
            return filename;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const deleteSupportFiles = createAsyncThunk(
    'connection/delete/support-file/list',
    async(data: DeleteSupportFilesRequest, thunkAPI) => {
        try{
            const request = new SupportFileRequest();
            await request.deleteSupportFiles(data);
            return data.filenames;
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
    deleteSupportFile,
    deleteSupportFiles,
}
