/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {ApplicationRequest} from "../../requests/classes/Application";
import {ITicket} from "../../interfaces/ITicket";
import {SettingsProps} from "../../requests/interfaces/IResponse";
import {RemoteApiRequestProps} from "../../requests/interfaces/IApplication";
import {errorHandler} from "../../utils/utils";
import {tmpServerOpenCeliumUrl} from "@entity/application/requests/classes/url";
import ModelUpdateThemes from "@application/requests/models/UpdateThemes";


export const updateThemes = createAsyncThunk(
    'application/update/themes',
    async(data: ModelUpdateThemes, thunkAPI) => {
        try {
            const request = new ApplicationRequest();
            const response = await request.updateThemes(data);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getLogoName = createAsyncThunk(
    'application/get/logoName',
    async(email: string, thunkAPI) => {
        try{
            const request = new ApplicationRequest({url: `${tmpServerOpenCeliumUrl}fsdlfshdfksldfdfsd-sdfjslkdfhsdlkfhfs-sdfjskdfhjsbdasdalksdhah/name/${email}`});
            const response = await request.getLogoName(email);
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addTicket = createAsyncThunk(
    'application/add/ticket',
    async(ticket: ITicket, thunkAPI) => {
        try {
            const request = new ApplicationRequest();
            const response = await request.addTicket(ticket);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getVersion = createAsyncThunk(
    'application/get/version',
    async(data: never, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            const response = await request.getVersion();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getResources = createAsyncThunk(
    'application/get/resources',
    async(settings: SettingsProps | void, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            const response = await request.getResources();
            // @ts-ignore
            const withoutNotification = settings && settings?.withoutNotification ? settings.withoutNotification : response.data.files_name.length === 0;
            return {data: response.data, settings: {withoutNotification}};
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getGlobalSearchData = createAsyncThunk(
    'application/get/globalSearchData',
    async(searchValue: string, thunkAPI) => {
        try{
            const request = new ApplicationRequest({endpoint: `/${searchValue}`});
            const response = await request.getGlobalSearchData();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllComponents = createAsyncThunk(
    'application/get/component/all',
    async(data: never, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            const response = await request.getAllComponents();
            // @ts-ignore
            return response.data._embedded?.componentResourceList || [];
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateResources = createAsyncThunk(
    'application/resources/update',
    async(data: never, thunkAPI) => {
        try{
            const request = new ApplicationRequest();
            const response = await request.updateResources();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const openExternalUrl = createAsyncThunk(
    'application/externalUrl/open',
    async(url: string, thunkAPI) => {
        try{
            const request = new ApplicationRequest({url, isFullUrl: true, hasAuthToken: false});
            const response = await request.openExternalUrl();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

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



export default {
    updateThemes,
    getLogoName,
    addTicket,
    getVersion,
    getResources,
    getGlobalSearchData,
    getAllComponents,
    updateResources,
    openExternalUrl,
    requestRemoteApi,
}