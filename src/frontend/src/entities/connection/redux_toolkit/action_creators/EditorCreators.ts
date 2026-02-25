import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteApiRequestProps } from "@application/requests/interfaces/IApplication";
import { ApplicationRequest } from "@application/requests/classes/Application";
import { errorHandler } from "@application/utils/utils";
import {ConnectionRequest} from "@root/requests/classes/Connection";
import {SaveEditorConfig} from "@root/requests/interfaces/IConnection";

export const requestRemoteApi = createAsyncThunk(
    'application/remote_request/send',
    async(requestProps: RemoteApiRequestProps, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            const response = await request.remoteApiRequest(requestProps);
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const saveEditorConfig = createAsyncThunk(
    'connection/save/editor-config',
    async(data: SaveEditorConfig, thunkAPI) => {
        try{
            const request = new ConnectionRequest();
            console.log('save', data)
            //await request.saveEditorConfig(data);
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
  requestRemoteApi,
    saveEditorConfig,
}
