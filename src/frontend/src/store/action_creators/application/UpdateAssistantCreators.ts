import {createAsyncThunk} from "@reduxjs/toolkit";
import {UpdateAssistantRequest} from "@request/application/UpdateAssistant";
import {errorHandler} from "../../../components/utils";
import {IApplicationResponse} from "@requestInterface/application/IResponse";
import {CheckForUpdateProps} from "@requestInterface/application/IUpdateAssistant";
import {VERSION_STATUS} from "@interface/application/IApplication";


export const checkForUpdates = createAsyncThunk(
    'application/get/lastAvailableVersion',
    async(data: never, thunkAPI) => {
        try {
            let result: IApplicationResponse<CheckForUpdateProps>;
            // @ts-ignore
            const request = new UpdateAssistantRequest();
            const response = await request.getOnlineUpdates();
            let versions = response.data.filter(v => v.status === VERSION_STATUS.AVAILABLE);
            const currentVersion = response.data.find(v => v.status === VERSION_STATUS.CURRENT);
            const appVersion = currentVersion ? currentVersion.name : '';
            let version = appVersion;
            if(versions.length > 0){
                version = versions[0].name;
            }
            const hasUpdates = version !== appVersion;
            result = {data: {version, hasUpdates}, settings: {withoutNotification: !hasUpdates}}
            return result;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getOnlineUpdates = createAsyncThunk(
    'application/get/online_updates',
    async(data: never, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest();
            const response = await request.getOnlineUpdates();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getOfflineUpdates = createAsyncThunk(
    'application/get/offline_updates',
    async(data: never, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest();
            const response = await request.getOfflineUpdates();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const uploadApplicationFile = createAsyncThunk(
    'application/upload/application_file',
    async(applicationFile: FileList, thunkAPI) => {
        try {
            let data = new FormData();
            data.append('file', applicationFile[0]);
            const request = new UpdateAssistantRequest({isFormData: true});
            const response = await request.uploadApplicationFile(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteApplicationFile = createAsyncThunk(
    'application/delete/application_file',
    async(folderName: string, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest({endpoint: `/${folderName}`});
            const response = await request.deleteApplicationFile();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkApplicationBeforeUpdate = createAsyncThunk(
    'application/check_before_update',
    async(data: never, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest();
            const response = await request.checkApplicationBeforeUpdate();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateApplication = createAsyncThunk(
    'application/update',
    async(data: any, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest();
            const response = await request.uploadApplicationFile(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    getOnlineUpdates,
    getOfflineUpdates,
    uploadApplicationFile,
    deleteApplicationFile,
    checkApplicationBeforeUpdate,
    updateApplication,
}