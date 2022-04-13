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

import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {
    addConnector,
    checkConnectorTitle,
    deleteConnectorById,
    deleteConnectorImage,
    deleteConnectorsById,
    getAllConnectors,
    getConnectorById,
    testRequestData,
    updateConnector,
    uploadConnectorImage
} from "@action/ConnectorCreators";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {ICommonState} from "@interface/application/core";
import {CommonState} from "../store";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";
import ModelConnectorPoust from "@model/connector/ConnectorPoust";
import ModelConnector from "@model/connector/Connector";

export interface ConnectorState extends ICommonState{
    connectors: ModelConnector[],
    isCurrentConnectorHasInvalidRequestData: TRIPLET_STATE,
    isCurrentConnectorHasUniqueTitle: TRIPLET_STATE,
    testingRequestData: API_REQUEST_STATE,
    checkingConnectorTitle: API_REQUEST_STATE,
    addingConnector: API_REQUEST_STATE,
    updatingConnector: API_REQUEST_STATE,
    gettingConnector: API_REQUEST_STATE,
    gettingConnectors: API_REQUEST_STATE,
    deletingConnectorById: API_REQUEST_STATE,
    deletingConnectorsById: API_REQUEST_STATE,
    uploadingConnectorImage: API_REQUEST_STATE,
    deletingConnectorImage: API_REQUEST_STATE,
    currentConnector: ModelConnector,
}

const initialState: ConnectorState = {
    connectors: [],
    isCurrentConnectorHasInvalidRequestData: TRIPLET_STATE.INITIAL,
    isCurrentConnectorHasUniqueTitle: TRIPLET_STATE.INITIAL,
    testingRequestData: API_REQUEST_STATE.INITIAL,
    checkingConnectorTitle: API_REQUEST_STATE.INITIAL,
    addingConnector: API_REQUEST_STATE.INITIAL,
    updatingConnector: API_REQUEST_STATE.INITIAL,
    gettingConnector: API_REQUEST_STATE.INITIAL,
    gettingConnectors: API_REQUEST_STATE.INITIAL,
    deletingConnectorById: API_REQUEST_STATE.INITIAL,
    deletingConnectorsById: API_REQUEST_STATE.INITIAL,
    uploadingConnectorImage: API_REQUEST_STATE.INITIAL,
    deletingConnectorImage: API_REQUEST_STATE.INITIAL,
    currentConnector: null,
    ...CommonState,
}

export const connectorSlice = createSlice({
    name: 'connector',
    initialState,
    reducers: {
    },
    extraReducers: {
        [testRequestData.pending.type]: (state, action: PayloadAction<ModelConnectorPoust>) => {
            state.testingRequestData = API_REQUEST_STATE.START;
            state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.FALSE;
        },
        [testRequestData.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.testingRequestData = API_REQUEST_STATE.FINISH;
            if(parseInt(action.payload?.status.toString()) > 299){
                state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.TRUE;
            } else{
                state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.FALSE;
            }
            state.error = null;
        },
        [testRequestData.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.testingRequestData = API_REQUEST_STATE.ERROR;
            state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.TRUE;
            state.error = action.payload;
        },
        [checkConnectorTitle.pending.type]: (state) => {
            state.checkingConnectorTitle = API_REQUEST_STATE.START;
        },
        [checkConnectorTitle.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingConnectorTitle = API_REQUEST_STATE.FINISH;
            state.isCurrentConnectorHasUniqueTitle = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkConnectorTitle.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingConnectorTitle = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addConnector.pending.type]: (state) => {
            state.addingConnector = API_REQUEST_STATE.START;
        },
        [addConnector.fulfilled.type]: (state, action: PayloadAction<ModelConnector>) => {
            state.addingConnector = API_REQUEST_STATE.FINISH;
            state.connectors.push(action.payload);
            state.error = null;
        },
        [addConnector.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingConnector = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.CONNECTOR_EXISTS){
                state.isCurrentConnectorHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            if(action.payload?.message === ResponseMessages.CONNECTOR_COMMUNICATION_FAILED){
                state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.TRUE;
            }
            state.error = action.payload;
        },
        [updateConnector.pending.type]: (state) => {
            state.updatingConnector = API_REQUEST_STATE.START;
        },
        [updateConnector.fulfilled.type]: (state, action: PayloadAction<ModelConnector>) => {
            state.updatingConnector = API_REQUEST_STATE.FINISH;
            state.connectors = state.connectors.map(connector => connector.connectorId === action.payload.connectorId ? action.payload : connector);
            if(state.currentConnector && state.currentConnector.connectorId === action.payload.connectorId){
                state.currentConnector = action.payload;
            }
            state.error = null;
        },
        [updateConnector.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingConnector = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.CONNECTOR_EXISTS){
                state.isCurrentConnectorHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            if(action.payload?.message === ResponseMessages.CONNECTOR_COMMUNICATION_FAILED){
                state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.TRUE;
            }
            state.error = action.payload;
        },
        [getConnectorById.pending.type]: (state) => {
            state.gettingConnector = API_REQUEST_STATE.START;
            state.isCurrentConnectorHasUniqueTitle = TRIPLET_STATE.INITIAL;
            state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.INITIAL;
        },
        [getConnectorById.fulfilled.type]: (state, action: PayloadAction<ModelConnector>) => {
            state.gettingConnector = API_REQUEST_STATE.FINISH;
            state.currentConnector = action.payload;
            state.error = null;
        },
        [getConnectorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingConnector = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllConnectors.pending.type]: (state) => {
            state.gettingConnectors = API_REQUEST_STATE.START;
        },
        [getAllConnectors.fulfilled.type]: (state, action: PayloadAction<ModelConnector[]>) => {
            state.gettingConnectors = API_REQUEST_STATE.FINISH;
            state.connectors = action.payload;
            state.isCurrentConnectorHasUniqueTitle = TRIPLET_STATE.INITIAL;
            state.isCurrentConnectorHasInvalidRequestData = TRIPLET_STATE.INITIAL;
            state.error = null;
        },
        [getAllConnectors.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingConnectors = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteConnectorById.pending.type]: (state) => {
            state.deletingConnectorById = API_REQUEST_STATE.START;
        },
        [deleteConnectorById.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingConnectorById = API_REQUEST_STATE.FINISH;
            state.connectors = state.connectors.filter(connector => connector.connectorId !== action.payload);
            if(state.currentConnector && state.currentConnector.connectorId === action.payload){
                state.currentConnector = null;
            }
            state.error = null;
        },
        [deleteConnectorById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingConnectorById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteConnectorsById.pending.type]: (state) => {
            state.deletingConnectorsById = API_REQUEST_STATE.START;
        },
        [deleteConnectorsById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingConnectorsById = API_REQUEST_STATE.FINISH;
            state.connectors = state.connectors.filter(connector => action.payload.findIndex(id => id === connector.connectorId) === -1);
            if(state.currentConnector && action.payload.findIndex(id => id === state.currentConnector.connectorId) !== -1){
                state.currentConnector = null;
            }
            state.error = null;
        },
        [deleteConnectorsById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingConnectorsById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadConnectorImage.pending.type]: (state) => {
            state.uploadingConnectorImage = API_REQUEST_STATE.START;
        },
        [uploadConnectorImage.fulfilled.type]: (state, action: PayloadAction<ModelConnector>) => {
            state.uploadingConnectorImage = API_REQUEST_STATE.FINISH;
            state.connectors = state.connectors.map(connector => connector.connectorId === action.payload.connectorId ? action.payload : connector);
            if(state.currentConnector && state.currentConnector.connectorId === action.payload.connectorId){
                state.currentConnector = action.payload;
            }
            state.error = null;
        },
        [uploadConnectorImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingConnectorImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteConnectorImage.pending.type]: (state) => {
            state.deletingConnectorImage = API_REQUEST_STATE.START;
        },
        [deleteConnectorImage.fulfilled.type]: (state, action: PayloadAction<number>) => {
            state.deletingConnectorImage = API_REQUEST_STATE.FINISH;
            state.connectors = state.connectors.map(connector => connector.connectorId === action.payload ? {...connector, icon: ''} : connector);
            if(state.currentConnector && state.currentConnector.connectorId === action.payload){
                state.currentConnector = {...state.currentConnector, icon: ''};
            }
            state.error = null;
        },
        [deleteConnectorImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingConnectorImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export default connectorSlice.reducer;