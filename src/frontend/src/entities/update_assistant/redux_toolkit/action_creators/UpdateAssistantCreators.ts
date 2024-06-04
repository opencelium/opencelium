/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createAsyncThunk} from "@reduxjs/toolkit";
import {UpdateAssistantRequest} from "@entity/update_assistant/requests/UpdateAssistant";
import {IApplicationResponse} from "@application/requests/interfaces/IResponse";
import {CheckForUpdateProps} from "@application/requests/interfaces/IUpdateAssistant";
import {VERSION_STATUS} from "@application/interfaces/IApplication";
import {errorHandler, timeout} from "@application/utils/utils";


export const checkForUpdates = createAsyncThunk(
    'application/get/lastAvailableVersion',
    async(data: never, thunkAPI) => {
        try {
            let result: IApplicationResponse<CheckForUpdateProps>;
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

export const uploadOnlineVersion = createAsyncThunk(
    'application/upload/online',
    async(version: string, thunkAPI) => {
        try {
            const request = new UpdateAssistantRequest({endpoint: `/online/version/${version}`});
            const response = await request.uploadOnlineVersion();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const downloadOnlineVersion = createAsyncThunk(
    'application/download/online',
    async(version: string, thunkAPI) => {
        try {
            await timeout();
            //const request = new UpdateAssistantRequest({endpoint: `/online/version/${version}/download`});
            //const response = await request.downloadOnlineVersion();
            //return response.data;
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
    async({applicationFile, onUploadProgress}: any, thunkAPI) => {
        try {
            let data = new FormData();
            data.append('file', applicationFile);
            const request = new UpdateAssistantRequest({isFormData: true});
            const response = await request.uploadApplicationFile(data, onUploadProgress);
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
            const response = await request.updateApplication(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    uploadOnlineVersion,
    downloadOnlineVersion,
    getOnlineUpdates,
    getOfflineUpdates,
    uploadApplicationFile,
    deleteApplicationFile,
    checkApplicationBeforeUpdate,
    updateApplication,
    checkForUpdates,
}
