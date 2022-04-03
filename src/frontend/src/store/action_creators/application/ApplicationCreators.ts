/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {createAsyncThunk} from "@reduxjs/toolkit";
import {ApplicationRequest} from "@request/application/Application";
import {ITicket} from "@interface/application/ITicket";
import {errorHandler} from "../../../components/utils";
import {SettingsProps} from "@requestInterface/application/IResponse";

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
            return {data: response.data, settings};
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
            const request = new ApplicationRequest({url, isFullUrl: true});
            const response = await request.openExternalUrl();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    addTicket,
    getVersion,
    getResources,
    getGlobalSearchData,
    getAllComponents,
    updateResources,
    openExternalUrl,
}