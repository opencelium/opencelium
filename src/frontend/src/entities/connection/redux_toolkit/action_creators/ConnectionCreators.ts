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
import {errorHandler} from "@application/utils/utils";
import {ConnectionRequest} from "../../requests/classes/Connection";
import { IConnection } from "../../interfaces/IConnection";

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
            return response.data;
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
            return response.data;
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
    checkConnectionTitle,
    addConnection,
    updateConnection,
    getConnectionById,
    getAllConnections,
    getAllMetaConnections,
    deleteConnectionById,
    deleteConnectionsById,
}