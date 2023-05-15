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
import {ResponseMessages} from "@application/requests/interfaces/IResponse";
import {IEntityWithImage} from "@application/requests/interfaces/IRequest";
import {errorHandler} from "@application/utils/utils";
import {ConnectorRequest} from "../../requests/classes/Connector";
import ModelConnectorPoust from "../../requests/models/ConnectorPoust";


export const testRequestData = createAsyncThunk(
    'connector/test/request_data',
    async(connector: ModelConnectorPoust, thunkAPI) => {
        try {
            const request = new ConnectorRequest({endpoint: '/check'});
            const response = await request.testRequestData(connector);
            if(parseInt(response.data.status.toString()) > 299){
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_COMMUNICATION_FAILED}));
            } else{
                return response;
            }
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const checkConnectorTitle = createAsyncThunk(
    'connector/exist/title',
    async(title: string, thunkAPI) => {
        try {
            title = title.split('/').join('//');
            title = encodeURIComponent(title);
            const request = new ConnectorRequest({endpoint: `/${title}`});
            const response = await request.checkConnectorTitle();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const addConnector = createAsyncThunk(
    'connector/add',
    async({entityData, iconFile, shouldDeleteIcon} : IEntityWithImage<ModelConnectorPoust>, thunkAPI) => {
        try {
            let title = entityData.title.split('/').join('//');
            title = encodeURIComponent(title);
            const checkTitleRequest = new ConnectorRequest({endpoint: `/${title}`});
            const responseTitleRequest = await checkTitleRequest.checkConnectorTitle();
            if (responseTitleRequest.data.message === ResponseMessages.EXISTS) {
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_EXISTS}));
            }
            const testDataRequest = new ConnectorRequest({endpoint: '/check'});
            const responseDataRequest = await testDataRequest.testRequestData(entityData);
            if(responseDataRequest.data.message === ResponseMessages.CONNECTOR_COMMUNICATION_FAILED || parseInt(responseDataRequest.data.status.toString()) > 299){
                return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_COMMUNICATION_FAILED}));
            }
            const addConnectorRequest = new ConnectorRequest();
            const response = await addConnectorRequest.addConnector(entityData);
            if(iconFile){
                let data: FormData = new FormData();
                data.append('connectorId', response.data.connectorId.toString());
                data.append('file', iconFile[0]);
                const uploadIconRequest = new ConnectorRequest({isFormData: true});
                await uploadIconRequest.uploadConnectorImage(data);
            } else if(shouldDeleteIcon){
                const deleteIconRequest = new ConnectorRequest({endpoint: `/${response.data.connectorId}/icon`});
                await deleteIconRequest.deleteConnectorImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const updateConnector = createAsyncThunk(
    'connector/update',
    async({entityData, iconFile, shouldDeleteIcon, hasCheck} : IEntityWithImage<ModelConnectorPoust>, thunkAPI) => {
        try {
            // @ts-ignore
            const connectorState = thunkAPI.getState().connectorReducer;
            if(connectorState.currentConnector && connectorState.currentConnector.title !== entityData.title){
                let title = entityData.title.split('/').join('//');
                title = encodeURIComponent(title);
                const checkTitleRequest = new ConnectorRequest({endpoint: `/${title}`});
                const responseTitleRequest = await checkTitleRequest.checkConnectorTitle();
                if (responseTitleRequest.data.message === ResponseMessages.EXISTS) {
                    return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_EXISTS}));
                }
            }
            if(typeof hasCheck === 'undefined' || hasCheck){
                const testDataRequest = new ConnectorRequest({endpoint: '/check'});
                const responseDataRequest = await testDataRequest.testRequestData(entityData);
                if(responseDataRequest.data.message === ResponseMessages.CONNECTOR_COMMUNICATION_FAILED || parseInt(responseDataRequest.data.status.toString()) > 299){
                    return thunkAPI.rejectWithValue(errorHandler({message: ResponseMessages.CONNECTOR_COMMUNICATION_FAILED}));
                }
            }
            const updateConnectorRequest = new ConnectorRequest({endpoint: `/${entityData.connectorId}`});
            let response: any = await updateConnectorRequest.updateConnector(entityData);
            if(iconFile){
                let data: FormData = new FormData();
                data.append('connectorId', entityData.connectorId.toString());
                data.append('file', iconFile[0]);
                const uploadIconRequest = new ConnectorRequest({isFormData: true});
                response = await uploadIconRequest.uploadConnectorImage(data);
            } else if(shouldDeleteIcon){
                const deleteIconRequest = new ConnectorRequest({endpoint: `/${entityData.connectorId}/icon`});
                await deleteIconRequest.deleteConnectorImage();
            }
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getConnectorById = createAsyncThunk(
    'connector/get/byId',
    async(connectorId: number, thunkAPI) => {
        try {
            const request = new ConnectorRequest({endpoint: `/${connectorId}`});
            const response = await request.getConnectorById();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const getAllConnectors = createAsyncThunk(
    'connector/get/all',
    async(data: never, thunkAPI) => {
        try {
            const request = new ConnectorRequest({endpoint: `/all`});
            const response = await request.getAllConnectors();
            return response.data._embedded?.connectorResourceList || [];
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteConnectorById = createAsyncThunk(
    'connector/delete/byId',
    async(id: number, thunkAPI) => {
        try {
            const request = new ConnectorRequest({endpoint: `/${id}`});
            await request.deleteConnectorById();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteConnectorsById = createAsyncThunk(
    'connector/delete/selected/byId',
    async(connectorIds: number[], thunkAPI) => {
        try {
            const request = new ConnectorRequest();
            await request.deleteConnectorsById(connectorIds);
            return connectorIds;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const uploadConnectorImage = createAsyncThunk(
    'connector/upload/image',
    async(data: {id: number, image: any}, thunkAPI) => {
        try{
            let formData: FormData = new FormData();
            formData.append('connectorId', data.id.toString());
            formData.append('file', data.image[0]);
            const request = new ConnectorRequest({isFormData: true});
            const response = await request.uploadConnectorImage(formData);
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export const deleteConnectorImage = createAsyncThunk(
    'connector/delete/image',
    async(id: number, thunkAPI) => {
        try {
            const request = new ConnectorRequest({endpoint: `/${id}/icon`});
            await request.deleteConnectorImage();
            return id;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    testRequestData,
    checkConnectorTitle,
    addConnector,
    updateConnector,
    getConnectorById,
    getAllConnectors,
    deleteConnectorById,
    deleteConnectorsById,
    uploadConnectorImage,
    deleteConnectorImage,
}
