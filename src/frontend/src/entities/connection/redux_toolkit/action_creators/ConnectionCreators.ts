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
import {errorHandler, sortByIndex} from "@application/utils/utils";
import {ConnectionRequest} from "../../requests/classes/Connection";
import { IConnection } from "../../interfaces/IConnection";
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import {ScheduleRequest} from "@entity/schedule/requests/classes/Schedule";
import ModelWebhook from "@entity/schedule/requests/models/Webhook";


export const testConnection = createAsyncThunk(
    'connection/test',
    async(connection: IConnection, thunkAPI) => {
        try {
            const now = new Date();
            const date = new Date(now.getTime() + 10000);
            const addConnectionRequest = new ConnectionRequest();
            connection.title = `test_connection_${+ date}_${connection.title}`;
            const addConnectionResponse = await addConnectionRequest.addConnection(connection);
            const createdConnection = addConnectionResponse.data;
            const schedule = {
                cronExp: `0 0 0 1 JAN ? 2100`,
                debugMode: false,
                status: 1,
                title: `test_schedule_${+ date}_${createdConnection.title}`,
                connectionId: createdConnection.connectionId,
            }
            const addScheduleRequest = new ScheduleRequest();
            const addScheduleResponse = await addScheduleRequest.addSchedule(schedule);
            const addedSchedule = addScheduleResponse.data;
            const executeScheduleRequest = new ScheduleRequest({endpoint: `/execute/${addedSchedule.schedulerId}`});
            await executeScheduleRequest.startSchedule();
            const deleteScheduleRequest = new ScheduleRequest({endpoint: `/${addedSchedule.schedulerId}`});
            await deleteScheduleRequest.deleteScheduleById();
            return {};
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkConnectionTitle = createAsyncThunk(
    'connection/exist/title',
    async(connection: IConnection, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/check/${connection.title}`});
            const response = await request.checkConnectionTitle();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addConnection = createAsyncThunk(
    'connection/add',
    async(connection: IConnection, thunkAPI) => {
        try {
            const request = new ConnectionRequest();
            const response = await request.addConnection(connection);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addTestConnection = createAsyncThunk(
    'connection/add/test',
    async(connection: IConnection, thunkAPI) => {
        try {
            const request = new ConnectionRequest();
            const now = new Date();
            const date = new Date(now.getTime() + 10000);
            const title = `test_connection_${+ date}_${connection.title}`;
            delete connection.id;
            const response = await request.addConnection({...connection, title});
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAndUpdateConnection = createAsyncThunk(
    'connection/getAndUpdate',
    async(connection: IConnection, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/check/${connection.title}`});
            const response = await request.checkConnectionTitle();
            if (response.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_EXISTS}));
            }
            const GetConnectionRequest = new ConnectionRequest({endpoint: `/${connection.id}`});
            const GetConnectionResponse = await GetConnectionRequest.getConnectionById();
            const getConnection = GetConnectionResponse.data;
            getConnection.fromConnector.methods = sortByIndex([...getConnection.fromConnector.methods]);
            getConnection.fromConnector.operators = sortByIndex([...getConnection.fromConnector.operators]);
            getConnection.toConnector.methods = sortByIndex([...getConnection.toConnector.methods]);
            getConnection.toConnector.operators = sortByIndex([...getConnection.toConnector.operators]);
            let fieldBinding: any = [];
            for(let i = 0; i < getConnection.fieldBinding.length; i++){
                let fieldBindingItem = {...getConnection.fieldBinding[i]};
                if(fieldBindingItem && fieldBindingItem.hasOwnProperty('enhancement') && fieldBindingItem.enhancement && fieldBindingItem.enhancement.hasOwnProperty('enhanceId')){
                    let newEnhancement = {...fieldBindingItem.enhancement};
                    if(newEnhancement){
                        delete newEnhancement.enhanceId;
                        fieldBindingItem.enhancement = newEnhancement;
                    }
                }
                fieldBinding.push(fieldBindingItem);
            }
            getConnection.fieldBinding = fieldBinding;
            const UpdateConnectionRequest = new ConnectionRequest({endpoint: `/${connection.id}`});
            const UpdateConnectionResponse = await UpdateConnectionRequest.updateConnection({...getConnection, id: connection.id, title: connection.title, description: connection.description});
            return UpdateConnectionResponse.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateConnection = createAsyncThunk(
    'connection/update',
    async(connection: IConnection, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/${connection.id}`});
            const response = await request.updateConnection(connection);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getConnectionById = createAsyncThunk(
    'connection/get/byId',
    async(connectionId: number, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/${connectionId}`});
            const response = await request.getConnectionById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllConnections = createAsyncThunk(
    'connection/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/all`});
            const response = await request.getAllConnections();
            // @ts-ignore
            return response.data.filter((connection) => {
                if(connection.title.indexOf('test_connection_') === 0){
                    if(connection.title.split('_').length >= 3){
                        return false;
                    }
                }
                return true;
            }) || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllMetaConnections = createAsyncThunk(
    'connection/get/all/metadata',
    async(data: never, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/all`});
            const response = await request.getAllMetaConnections();
            // @ts-ignore
            return response.data/*.filter((connection) => {
                if(connection.title.indexOf('test_connection_') === 0){
                    if(connection.title.split('_').length >= 3){
                        return false;
                    }
                }
                return true;
            }) */|| [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteConnectionById = createAsyncThunk(
    'connection/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/${id}`});
            await request.deleteConnectionById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteTestConnectionById = createAsyncThunk(
    'connection/delete/test/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new ConnectionRequest({endpoint: `/${id}`});
            await request.deleteConnectionById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteConnectionsById = createAsyncThunk(
    'connection/delete/selected/byId',
    async(connectionIds: number[], thunkAPI) => {
        try {
            const request = new ConnectionRequest();
            await request.deleteConnectionsById(connectionIds);
            return connectionIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    testConnection,
    checkConnectionTitle,
    addConnection,
    addTestConnection,
    getAndUpdateConnection,
    updateConnection,
    getConnectionById,
    getAllConnections,
    getAllMetaConnections,
    deleteConnectionById,
    deleteTestConnectionById,
    deleteConnectionsById,
}